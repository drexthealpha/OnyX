# ONYX Hermes Benchmarks

Benchmark environments for evaluating ONYX Hermes agent performance.

## Status

Hermes benchmark environments are sourced from the `openclaw/hermes-benchmarks`
repository (not available in Gen-Verse/OpenClaw-RL). This directory is a
placeholder pending integration.

## Planned Environments

| Environment | Type | Status |
|---|---|---|
| hermes-math | Mathematical reasoning | Planned |
| hermes-code | Code generation | Planned |
| hermes-tool | Tool-call accuracy | Planned |
| hermes-swe | SWE-Bench subset | Planned |

## Running Benchmarks

```bash
# Once environments are available:
python -m onyx_hermes_bench --env hermes-math --model onyx-agent
```