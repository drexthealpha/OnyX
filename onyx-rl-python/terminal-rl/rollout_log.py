"""ONYX Terminal-RL rollout logging.

Ported from Gen-Verse/OpenClaw-RL terminal-rl/rollout_log.py.
After each training run, results are POSTed to the ONYX RL TypeScript loop
at http://localhost:${RL_PORT}/outcome.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict

import requests
import wandb
from slime.utils import logging_utils
from slime.utils.types import Sample
from slime.ray.rollout import compute_rollout_step

logger = logging.getLogger("onyx.terminal_rl.rollout_log")


def _ensure_terminal_step_metric(args) -> None:
    if not getattr(args, "use_wandb", False):
        return
    try:
        wandb.define_metric("terminal/*", step_metric="rollout/step")
    except Exception as e:
        logger.warning("Failed to define wandb step metric for terminal/*: %s", e)


def _post_outcome_to_rl_loop(log_dict: Dict[str, Any], rollout_id: int) -> None:
    """POST training results to the ONYX RL TypeScript loop.

    Target: http://localhost:${RL_PORT}/outcome
    Env var: RL_PORT (default: 8080)

    Fires-and-forgets: logs a warning on failure but never raises.
    """
    rl_port = os.getenv("RL_PORT", "8080")
    url = f"http://localhost:{rl_port}/outcome"
    payload = {
        "rollout_id": rollout_id,
        "source": "onyx-terminal-rl",
        **log_dict,
    }
    try:
        resp = requests.post(url, json=payload, timeout=5)
        if resp.ok:
            logger.info("[ONYX] POSTed outcome to RL loop: rollout_id=%d status=%d", rollout_id, resp.status_code)
        else:
            logger.warning(
                "[ONYX] RL loop POST returned non-2xx: %d %s", resp.status_code, resp.text[:200]
            )
    except requests.exceptions.ConnectionError:
        logger.debug("[ONYX] RL loop not reachable at %s (RL_PORT=%s) — skipping outcome POST", url, rl_port)
    except Exception as exc:
        logger.warning("[ONYX] Failed to POST outcome to RL loop at %s: %s", url, exc)


def rollout_log(rollout_id, args, samples, rollout_extra_metrics, rollout_time):

    trainable = [s for s in samples if not getattr(s, "remove_sample", False)]
    non_trainable = [s for s in samples if getattr(s, "remove_sample", False)]

    log_dict: Dict[str, Any] = {}

    total = len(samples)
    n_failed = sum(1 for s in samples if s.status == Sample.Status.FAILED)
    n_aborted = sum(1 for s in samples if s.status == Sample.Status.ABORTED)
    n_truncated = sum(1 for s in samples if s.status == Sample.Status.TRUNCATED)
    n_completed = sum(1 for s in samples if s.status == Sample.Status.COMPLETED)

    log_dict["terminal/total_samples"] = total
    log_dict["terminal/completed"] = n_completed
    log_dict["terminal/truncated"] = n_truncated
    log_dict["terminal/failed"] = n_failed
    log_dict["terminal/aborted"] = n_aborted
    log_dict["terminal/failed_ratio"] = n_failed / total if total else 0.0
    log_dict["terminal/non_trainable_ratio"] = (
        len(non_trainable) / total if total else 0.0
    )

    if trainable:
        trainable_rewards = [s.reward["score"] for s in trainable]
        log_dict["terminal/reward_mean"] = sum(trainable_rewards) / len(
            trainable_rewards
        )
        log_dict["terminal/reward_min"] = min(trainable_rewards)
        log_dict["terminal/reward_max"] = max(trainable_rewards)

        trainable_accs = []
        for s in trainable:
            if isinstance(s.reward, dict) and "accuracy" in s.reward:
                trainable_accs.append(float(s.reward["accuracy"]))
        if trainable_accs:
            log_dict["terminal/accuracy"] = sum(trainable_accs) / len(trainable_accs)

        trainable_prm = []
        for s in trainable:
            if isinstance(s.reward, dict) and "prm_turn_score" in s.reward:
                trainable_prm.append(float(s.reward["prm_turn_score"]))
        if trainable_prm:
            log_dict["terminal/prm_turn_score"] = sum(trainable_prm) / len(
                trainable_prm
            )

    log_dict["terminal/rollout_time"] = rollout_time

    step = compute_rollout_step(args, rollout_id)
    log_dict["rollout/step"] = step
    _ensure_terminal_step_metric(args)
    logging_utils.log(args, log_dict, step_key="rollout/step")

    # ── ONYX: POST results to TypeScript RL loop ──────────────────────────────
    _post_outcome_to_rl_loop(log_dict, rollout_id)
    # ─────────────────────────────────────────────────────────────────────────

    return False