"""
@onyx/studio — FastAPI TTS backend

Agents can call this server to synthesize audio via Python TTS engines
(Kokoro, StyleTTS2, Orpheus) without needing direct process access.

POST /synthesize
  Body: { text: str, engine: str, config?: { speed?, pitch?, voice? } }
  Returns: audio/wav bytes

GET /engines
  Returns: list of available engine names

Run:
  pip install fastapi uvicorn kokoro-onnx styletts2 orpheus-tts
  python backend/main.py
"""

from __future__ import annotations

import io
import logging
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Literal, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

logger = logging.getLogger("onyx-studio")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(
    title="ONYX Studio TTS Backend",
    description="Python TTS engine server for @onyx/studio",
    version="0.1.0",
)


class VoiceConfig(BaseModel):
    speed: Optional[float] = 1.0
    pitch: Optional[float] = 0.0
    voice: Optional[str] = None


class SynthesizeRequest(BaseModel):
    text: str
    engine: Literal["kokoro", "style-tts2", "orpheus", "edge"] = "kokoro"
    config: Optional[VoiceConfig] = None


def _is_installed(module: str) -> bool:
    try:
        subprocess.run(
            [sys.executable, "-c", f"import {module}"],
            check=True, capture_output=True, timeout=5,
        )
        return True
    except Exception:
        return False


ENGINES: dict[str, bool] = {}


def _refresh_engines() -> None:
    global ENGINES
    ENGINES = {
        "kokoro": _is_installed("kokoro"),
        "style-tts2": _is_installed("styletts2"),
        "orpheus": _is_installed("orpheus_tts"),
        "edge": True,
    }


_refresh_engines()


def _synthesize_kokoro(text: str, config: VoiceConfig) -> bytes:
    """Synthesize via Kokoro (kokoro-onnx)."""
    import kokoro
    from kokoro import generate
    import soundfile as sf

    voice = config.voice or "af_heart"
    audio, sr = generate(text, voice=voice, speed=config.speed or 1.0)

    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV")
    return buf.getvalue()


def _synthesize_styletts2(text: str, config: VoiceConfig) -> bytes:
    """Synthesize via StyleTTS2."""
    import styletts2

    out_path = Path(tempfile.mktemp(suffix=".wav"))
    styletts2.synthesize(
        text,
        output_path=str(out_path),
        reference=config.voice,
        speed=config.speed or 1.0,
    )
    data = out_path.read_bytes()
    out_path.unlink(missing_ok=True)
    return data


def _synthesize_orpheus(text: str, config: VoiceConfig) -> bytes:
    """Synthesize via Orpheus TTS."""
    import orpheus_tts

    out_path = Path(tempfile.mktemp(suffix=".wav"))
    orpheus_tts.synthesize(
        text,
        output_path=str(out_path),
        voice=config.voice,
        speed=config.speed or 1.0,
    )
    data = out_path.read_bytes()
    out_path.unlink(missing_ok=True)
    return data


def _synthesize_edge(text: str, config: VoiceConfig) -> bytes:
    """Synthesize via edge-tts Python package."""
    import asyncio
    import edge_tts

    voice = config.voice or "en-US-AriaNeural"

    async def _run() -> bytes:
        communicate = edge_tts.Communicate(text, voice)
        chunks: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                chunks.append(chunk["data"])
        return b"".join(chunks)

    return asyncio.run(_run())


_ENGINE_MAP = {
    "kokoro": _synthesize_kokoro,
    "style-tts2": _synthesize_styletts2,
    "orpheus": _synthesize_orpheus,
    "edge": _synthesize_edge,
}


@app.get("/health")
def health():
    return {"status": "ok", "engines": ENGINES}


@app.get("/engines")
def get_engines():
    _refresh_engines()
    return {"engines": [name for name, available in ENGINES.items() if available]}


@app.post("/synthesize")
def synthesize(req: SynthesizeRequest):
    engine_name = req.engine
    config = req.config or VoiceConfig()

    if not ENGINES.get(engine_name):
        raise HTTPException(
            status_code=503,
            detail=f"Engine '{engine_name}' is not available. "
                   f"Install the required Python package.",
        )

    fn = _ENGINE_MAP.get(engine_name)
    if fn is None:
        raise HTTPException(status_code=400, detail=f"Unknown engine: {engine_name}")

    try:
        audio_bytes = fn(req.text, config)
    except Exception as exc:
        logger.exception("Synthesis failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    media_type = "audio/wav" if engine_name != "edge" else "audio/mpeg"
    return Response(content=audio_bytes, media_type=media_type)


if __name__ == "__main__":
    port = int(os.environ.get("STUDIO_PORT", "4400"))
    logger.info("Starting ONYX Studio backend on port %d", port)
    uvicorn.run(app, host="0.0.0.0", port=port)