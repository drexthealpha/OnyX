import { getUmbraClient } from '@umbra-privacy/sdk';
import type { UmbraNetwork } from './types.js';

export interface OnyxUmbraConfig {
  signer: unknown;
  network?: UmbraNetwork;
  rpcUrl?: string;
  rpcSubscriptionsUrl?: string;
  indexerApiEndpoint?: string;
  deferMasterSeedSignature?: boolean;
}

export async function createUmbraClient(config: OnyxUmbraConfig) {
  const network = (config.network
    ?? (process.env['UMBRA_NETWORK'] as UmbraNetwork | undefined)
    ?? 'devnet') as UmbraNetwork;

  const rpcUrl = config.rpcUrl
    ?? process.env['UMBRA_RPC_URL']
    ?? 'https://api.mainnet-beta.solana.com';

  const rpcSubscriptionsUrl = config.rpcSubscriptionsUrl
    ?? process.env['UMBRA_RPC_WS_URL']
    ?? 'wss://api.mainnet-beta.solana.com';

  const indexerApiEndpoint = config.indexerApiEndpoint
    ?? process.env['UMBRA_INDEXER_ENDPOINT']
    ?? 'https://utxo-indexer.api.umbraprivacy.com';

  if (!config.signer) {
    throw new Error(
      '[onyx-privacy] No signer provided. Pass a wallet adapter or call createInMemorySigner() from @umbra-privacy/sdk.',
    );
  }

  return getUmbraClient({
    signer: config.signer as Parameters<typeof getUmbraClient>[0]['signer'],
    network,
    rpcUrl,
    rpcSubscriptionsUrl,
    indexerApiEndpoint,
    deferMasterSeedSignature: config.deferMasterSeedSignature,
  });
}

export type UmbraClient = Awaited<ReturnType<typeof createUmbraClient>>;