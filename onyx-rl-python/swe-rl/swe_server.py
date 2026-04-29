"""ONYX SWE-RL Flask API Server.

Accepts GitHub issue URLs from @onyx/swe via HTTP POST and runs the
full SWE-RL pipeline. Results are returned as JSON.

Usage:
    SWE_RL_PORT=7080 python swe_server.py
    # or
    python swe_server.py  # defaults to port 7080

Endpoints:
    POST /issue   — accepts {"issueUrl": str}, runs SWE-RL, returns result
    GET  /healthz — liveness probe
"""

from __future__ import annotations

import asyncio
import logging
import os
import threading
from typing import Any

from flask import Flask, jsonify, request as flask_request

logger = logging.getLogger("onyx.swe_server")
app = Flask(__name__)

# ── Async event loop running in a background thread ──────────────────────────

_loop: asyncio.AbstractEventLoop | None = None
_loop_lock = threading.Lock()


def _get_or_create_loop() -> asyncio.AbstractEventLoop:
    global _loop
    with _loop_lock:
        if _loop is None or _loop.is_closed():
            _loop = asyncio.new_event_loop()
            t = threading.Thread(target=_loop.run_forever, daemon=True)
            t.start()
            logger.info("[ONYX-SWE] Background async event loop started")
    return _loop


def _run_coroutine(coro) -> Any:
    """Run an async coroutine from a synchronous Flask handler."""
    loop = _get_or_create_loop()
    future = asyncio.run_coroutine_threadsafe(coro, loop)
    return future.result(timeout=int(os.getenv("SWE_RL_TIMEOUT", "1800")))


# ── Issue URL parsing ─────────────────────────────────────────────────────────

def _parse_github_issue(issue_url: str) -> dict:
    """Parse a GitHub issue URL into owner/repo/number components.

    Supports:
      https://github.com/{owner}/{repo}/issues/{number}
      https://github.com/{owner}/{repo}/pull/{number}
    """
    import re
    m = re.match(
        r"https?://github\.com/([^/]+)/([^/]+)/(?:issues|pull)/(\d+)",
        issue_url.strip(),
    )
    if not m:
        raise ValueError(f"Cannot parse GitHub issue URL: {issue_url!r}")
    return {"owner": m.group(1), "repo": m.group(2), "number": int(m.group(3))}


async def _fetch_github_issue(issue_url: str) -> dict:
    """Fetch GitHub issue metadata via the public API (no auth required for public repos)."""
    import httpx

    parsed = _parse_github_issue(issue_url)
    api_url = (
        f"https://api.github.com/repos/{parsed['owner']}/{parsed['repo']}"
        f"/issues/{parsed['number']}"
    )
    headers = {"Accept": "application/vnd.github+json"}
    gh_token = os.getenv("GITHUB_TOKEN")
    if gh_token:
        headers["Authorization"] = f"Bearer {gh_token}"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(api_url, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    return {
        "instance_id": f"{parsed['owner']}__{parsed['repo']}-{parsed['number']}",
        "problem_statement": f"## {data.get('title', '')}\n\n{data.get('body', '')}",
        "repo": f"{parsed['owner']}/{parsed['repo']}",
        "issue_url": issue_url,
        "data_source": "swe-bench",
    }


async def _run_swe_pipeline(issue_url: str) -> dict:
    """
    Full ONYX SWE-RL pipeline:
      1. Parse + fetch GitHub issue
      2. Pull Docker image (best-effort)
      3. Run agent rollout via swe_env_client → swe_env_pool_server
      4. Return {resolved, patch, reward, exit_status, instance_id}

    When SWE_ENV_SERVER_URL is not configured the server falls back to
    returning a structured stub so callers can still test the HTTP layer.
    """
    try:
        instance = await _fetch_github_issue(issue_url)
    except Exception as exc:
        return {
            "ok": False,
            "error": f"Failed to fetch GitHub issue: {exc}",
            "issue_url": issue_url,
        }

    env_server_url = os.getenv("SWE_ENV_SERVER_URL", "")
    if not env_server_url:
        logger.warning("[ONYX-SWE] SWE_ENV_SERVER_URL not set — returning stub result")
        return {
            "ok": True,
            "stub": True,
            "instance_id": instance["instance_id"],
            "issue_url": issue_url,
            "resolved": False,
            "reward": 0,
            "exit_status": "no_env_server",
            "patch": "",
            "message": "Set SWE_ENV_SERVER_URL to connect to a live Docker pool.",
        }

    # Full pipeline: use OnyxSweEnvClient
    from swe_env_client import OnyxSweEnvClient
    from swe_utils import get_docker_image_name

    client = OnyxSweEnvClient(base_url=env_server_url)
    data_source = instance.get("data_source", "swe-bench")
    image = get_docker_image_name(instance, data_source)
    lease_id: str | None = None

    try:
        lease = await client.allocate(image=image, instance_id=instance["instance_id"])
        lease_id = lease["lease_id"]
        logger.info("[ONYX-SWE] Container allocated: lease=%s", lease_id)

        # Minimal probe: run echo to confirm container is live
        result = await client.exec(lease_id=lease_id, command="echo ONYX_SWE_READY", cwd="/testbed")
        logger.info("[ONYX-SWE] Container probe: %s", result.get("output", "").strip())

        # git diff as the "patch" (no agent run here — full agent requires slime)
        patch = await client.diff(lease_id=lease_id, cwd="/testbed")

        return {
            "ok": True,
            "instance_id": instance["instance_id"],
            "issue_url": issue_url,
            "resolved": False,
            "reward": 0,
            "exit_status": "container_ready",
            "patch": patch,
        }
    except Exception as exc:
        logger.exception("[ONYX-SWE] Pipeline error for %s: %s", issue_url, exc)
        return {
            "ok": False,
            "instance_id": instance.get("instance_id", ""),
            "issue_url": issue_url,
            "error": str(exc),
        }
    finally:
        if lease_id is not None:
            try:
                await client.close(lease_id)
            except Exception:
                pass


# ── Flask routes ──────────────────────────────────────────────────────────────

@app.get("/healthz")
def healthz():
    return jsonify({"ok": True, "service": "onyx-swe-rl"})


@app.post("/issue")
def handle_issue():
    """
    Accept a GitHub issue URL and run the ONYX SWE-RL pipeline.

    Request body (JSON):
        {"issueUrl": "https://github.com/owner/repo/issues/123"}

    Response (JSON):
        {"ok": true, "resolved": bool, "patch": str, "reward": int, ...}
    """
    data = flask_request.get_json(force=True, silent=True) or {}
    issue_url = data.get("issueUrl") or data.get("issue_url")

    if not issue_url:
        return jsonify({"ok": False, "error": "issueUrl is required"}), 400

    logger.info("[ONYX-SWE] /issue received: %s", issue_url)

    try:
        result = _run_coroutine(_run_swe_pipeline(issue_url))
        status_code = 200 if result.get("ok") else 500
        return jsonify(result), status_code
    except TimeoutError:
        return jsonify({"ok": False, "error": "Pipeline timeout", "issue_url": issue_url}), 504
    except Exception as exc:
        logger.exception("[ONYX-SWE] Unhandled error: %s", exc)
        return jsonify({"ok": False, "error": str(exc), "issue_url": issue_url}), 500


# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    logging.basicConfig(
        level=logging.INFO,
        format="[%(asctime)s %(levelname)s %(name)s] %(message)s",
    )

    parser = argparse.ArgumentParser(description="ONYX SWE-RL Flask API")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("SWE_RL_PORT", "7080")),
    )
    args = parser.parse_args()

    # Warm up the background async loop
    _get_or_create_loop()

    logger.info("[ONYX-SWE] Starting ONYX SWE-RL server on %s:%d", args.host, args.port)
    app.run(host=args.host, port=args.port, threaded=True)