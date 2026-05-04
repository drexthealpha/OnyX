# QVAC Track Submission — Local-First Inference

**Track:** Local Inference & Edge AI
**Package:** `@onyx/qvac`

## 🔎 Overview
ONYX integrates **QVAC** as its primary local-first inference backend. This ensures that even when internet connectivity is lost, or when processing sensitive data, the ONYX agent remains operational and private.

## 💡 Why QVAC?
- **Sovereignty:** No reliance on cloud providers or centralized API keys.
- **Privacy:** Data never leaves the user's device.
- **P2P Distribution:** Built-in support for P2P model weights sharing via `@onyx/qvac/p2p`.
- **Incentivized Compute:** Ready for agent-to-agent bandwidth and inference payments.

## 🛠️ Implementation
- **Fallback Router:** `@onyx/compute` automatically detects connectivity issues and routes requests to the local QVAC instance.
- **Model Manager:** `@onyx/qvac` manages quantized weights and optimizes them for edge hardware.
- **Nomad Integration:** Part of the `@onyx/nomad` survival protocol for extreme sovereignty.

## 🎥 Demo Scenario
1. Agent is performing a task using cloud LLMs.
2. Network connection is severed.
3. ONYX HUD displays "NOMAD MODE ACTIVE - LOCAL INFERENCE".
4. Agent continues the conversation using QVAC local weights seamlessly.

---
*Enabling fully offline, sovereign AI agents.*
