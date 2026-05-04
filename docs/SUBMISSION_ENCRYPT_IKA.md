# Encrypt / Ika Track Submission

**Project:** ONYX OS — MPC Signing Layer
**Integration:** `packages/onyx-bridge/` and `packages/onyx-fhe/`

We integrated dWallet network via Ika to provide agents with non-custodial wallets. Instead of keeping a `.env` with a plaintext private key (which is a massive security risk for autonomous agents), the key is sharded across the dWallet network. 

## Evidence
- `create_vault` tx: [PENDING]
- `execute_transfer` tx: [PENDING]
- dWallet MessageApproval tx: [PENDING]
