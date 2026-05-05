# OnyX Program - Solana On-Chain Architecture

## Overview

This document describes the on-chain account structure, PDA derivations, and agent workflows for the OnyX Sovereign AI OS program.

**Program ID:** `OnyXos1111111111111111111111111111111111111`

---

## Program Data Accounts (PDAs)

### OS Context (Singleton per Agent)

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  AGENT CONTEXT                                                                               │
│  ─────────────────────────────────────────────────────────────────────────────────────────  │
│  PDA Seeds: ["agent", agent_pubkey]                                                          │
│  Owner: OnyX Program                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────────  │
│  Fields:                                                                                     │
│    • bump: u8                                                                                │
│    • memory_index: u64                                                                       │
│    • dwallet_id: Pubkey (IKA Integration) ────────────────────────────────────────────────┐  │
│    • fhe_vault: Pubkey (Encrypt Integration) ──────────────────────────────────────────┐  │  │
│    • frozen: bool                                                                      │  │  │
└────────────────────────────────────────────────────────────────────────────────────────┼──┼──┘
                                                                                         │  │
                                                                                         ▼  ▼
```

### Encrypt FHE Memory Vault

```text
┌────────────────────────────────────────┐
│  MEMORY VAULT (Ciphertext)             │
│  ────────────────────────────────────  │
│  PDA Seeds: ["memory", agent_pubkey]   │
│  Owner: Encrypt Program                │
│  ────────────────────────────────────  │
│  Fields:                               │
│    • bump: u8                          │
│    • ciphertext_digest: [u8; 32]       │
│    • authorized: Pubkey ───────────────┼─> Points to Agent Context
│    • status: u8 (Pending/Verified)     │
│                                        │
│  [Stores encrypted vector memory]      │
└────────────────────────────────────────┘
```

---

## Token & Logic Flow Diagrams

### IKA dWallet Approval (Cross-Chain Signing)

```text
┌──────────────┐                              ┌──────────────┐
│ Agent Wallet │ ─────── CPI / Auth ────────► │ OnyX Kernel  │
│  (Signer)    │     (invoke_signed)          │  Program     │
└──────────────┘                              └──────┬───────┘
                                                     │ CPI (approve_message)
                                                     ▼
┌──────────────┐                              ┌──────────────┐
│ dWallet      │ ◄────── Event emitted ────── │ Ika Network  │
│ Coordinator  │                              │ (NOA)        │
└──────────────┘                              └──────────────┘
```

### Umbra ZK Stealth Transaction

```text
┌──────────────┐                              ┌──────────────┐
│ OnyX Agent   │ ─────── WebWorker ─────────► │ ZK Prover    │
│  (Frontend)  │       (Comlink)              │  (Groth16)   │
└──────┬───────┘                              └──────┬───────┘
       │                                             │
       │                                             │
       ▼                                             ▼
┌──────────────┐                              ┌──────────────┐
│ Stealth Relayer│ ◄────── Valid Proof ───────│ Umbra Mixer  │
│ (Pays Gas)   │                              │ (Solana)     │
└──────────────┘                              └──────────────┘
```

---

## PDA Derivation Reference

| Account | Seeds | Bump |
|---------|-------|------|
| AgentContext | `["agent", agent_pubkey: Pubkey]` | stored |
| MemoryVault | `["memory", agent_pubkey: Pubkey]` | stored |
| CpiAuthority | `["__ika_cpi_authority"]` | stored |
