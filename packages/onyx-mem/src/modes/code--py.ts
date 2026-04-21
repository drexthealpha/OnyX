// ─────────────────────────────────────────────
// onyx-mem · modes/code--py.ts
// Python domain hints
// ─────────────────────────────────────────────

export const codePyHints = `
Domain: Python
Extra extraction rules:
- Capture virtual environment decisions (venv, conda, uv, poetry).
- Note Python version constraints and why.
- Record async framework choices (asyncio, trio, anyio) and patterns used.
- Capture type annotation decisions (Pydantic models, dataclasses, TypedDict).
- Flag unhandled exceptions and bare 'except:' patterns as errors.
`.trim();