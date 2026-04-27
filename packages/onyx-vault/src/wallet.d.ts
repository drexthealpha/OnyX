/**
 * @onyx/vault — OnyxWallet
 *
 * Loads keypair from ONYX_WALLET_PATH (user-provided — operator cost: $0).
 * Private key stored ONLY in closure — never on `this`, never returned.
 *
 * Apollo-11 law: sovereign agent controls its own keys.
 * Apollo-11 law: private key bytes NEVER leave the closure after init.
 */
import type { Wallet, WalletConfig } from "./types.js";
/** Create an OnyxWallet from the keypair at ONYX_WALLET_PATH.
 * The private key is stored in the closure and NEVER exposed on the
 * returned object.
 */
export declare function createWallet(config?: Partial<WalletConfig>): Wallet;
/** Alias for createWallet */
export declare const OnyxWallet: {
    create: typeof createWallet;
};
//# sourceMappingURL=wallet.d.ts.map