// packages/onyx-compute/src/nosana/client.ts
//
// Singleton Nosana client.
// The user supplies NOSANA_PRIVATE_KEY (base58 encoded 64-byte keypair).
// Operator cost: $0 — all NOS token fees are paid by the end-user's wallet.

import { createNosanaClient, type NosanaClient } from '@nosana/kit';
import { NosanaNetwork } from '@nosana/types';

// Default mainnet RPC — can be overridden via NOSANA_RPC_URL env var.
const DEFAULT_RPC_URL =
  'https://rpc.ironforge.network/mainnet?apiKey=01J4RYMAWZC65B6CND9DTZZ5BK';

let _client: NosanaClient | null = null;

/**
 * Build a CryptoKeyPair-compatible signer from a base58 private key.
 * @nosana/kit Wallet type needs both signMessage and signTransaction.
 * We create a minimal shim that the kit accepts.
 */
async function walletFromPrivateKey(base58Key: string): Promise<import('@nosana/kit').Wallet> {
  // Dynamic import so the module works in environments without @solana/kit
  const { createKeyPairSignerFromBytes } = await import('@solana/kit');
  // @ts-ignore
  const bs58 = await import('bs58');

  const keyBytes = bs58.default.decode(base58Key);
  if (keyBytes.length !== 64) {
    throw new Error(
      `NOSANA_PRIVATE_KEY must be a base58-encoded 64-byte keypair. Got ${keyBytes.length} bytes.`
    );
  }

  // createKeyPairSignerFromBytes returns a TransactionSigner that also supports signMessage
  const signer = await createKeyPairSignerFromBytes(keyBytes);
  return signer as unknown as import('@nosana/kit').Wallet;
}

/**
 * Returns the singleton Nosana client.
 * Lazily initialised on first call.
 * Throws if NOSANA_PRIVATE_KEY is not set.
 */
export async function getNosanaClient(): Promise<NosanaClient> {
  if (_client) return _client;

  const privateKey = process.env.NOSANA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      'NOSANA_PRIVATE_KEY environment variable is required to use Nosana compute. ' +
        'Export your Solana wallet private key as base58.'
    );
  }

  const rpcUrl = process.env.NOSANA_RPC_URL ?? DEFAULT_RPC_URL;

  _client = createNosanaClient(NosanaNetwork.MAINNET, {
    solana: {
      rpcEndpoint: rpcUrl,
    },
    ipfs: {
      jwt: process.env.PINATA_JWT,
    }
  });

  // Wallet is set after construction (NosanaClient API)
  _client.wallet = await walletFromPrivateKey(privateKey);

  return _client;
}

/**
 * Reset the singleton (useful in tests).
 */
export function _resetClient(): void {
  _client = null;
}