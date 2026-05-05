# OnyX

[![npm](https://img.shields.io/npm/v/@onyx/kernel.svg?style=flat)](https://www.npmjs.com/package/@onyx/kernel)
[![nosana](https://img.shields.io/badge/Nosana-Mainnet-brightgreen.svg?style=flat)](https://nosana.io)

> [!IMPORTANT]
> OnyX is the first decentralized operating system for AI agents, built natively on Solana. It enables local-first inference, private stealth transactions, and FHE-encrypted memory vaults. All operator costs are $0 as users bring their own compute/keys via BYOK architecture.

## Architecture

- [`kernel`](packages/kernel) – Core L0 runtime and workspace management.
- [`privacy`](packages/onyx-privacy) – Umbra ZK-proof generation via WebWorkers.
- [`fhe`](packages/onyx-fhe) – Encrypt FHE computations and Ika dWallet 2PC-MPC signing.
- [`qvac`](packages/onyx-qvac) – Local-first inference backend utilizing the Singleton worker pattern.
- [`gateway`](packages/onyx-gateway) – Nosana decentralized GPU orchestration.
- [`agent`](packages/onyx-agent) – ElizaOS connector and workflow adapter.

For a full breakdown of the on-chain program PDAs, data structures, and token flows, see [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Programs

- `OnyX Kernel` - Routes agent actions and validates multi-sig contexts.
- `OnyX Privacy` - Implements the Umbra Stealth Address mixer for private agent transfers.
- `OnyX FHE` - Extends Encrypt's `#[encrypt_fn]` for confidential AI state operations.

For our vulnerability and incident reporting policies, please see [`SECURITY.md`](SECURITY.md).

## Usage & Development

To run the full suite, use the Solana toolchain alongside `pnpm`. For rigorous testing, we mandate cloning mainnet programs locally.

```bash
# Clone mainnet programs
make local-test-validator

# Install & Build
cp .env.example .env
pnpm install
pnpm build
pnpm test
```