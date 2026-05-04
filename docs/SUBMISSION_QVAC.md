# QVAC Track Submission

**What:** ONYX uses QVAC as the primary local-first inference backend.
**Why:** QVAC enables fully offline sovereign AI — no cloud, no API key, P2P model sharing.
**How:** `@onyx/qvac` wraps the QVAC SDK and integrates seamlessly into the `@onyx/nomad` offline survival mode and `@onyx/compute` fallback router.
**Demo:** Start ONYX with no internet → the agent automatically falls back to QVAC local inference → responses still work perfectly.
**WDK Integration:** `@onyx/qvac`'s `p2p.ts` is ready to enable agent-to-agent bandwidth payments via Bitcoin/USDt.
