import { getUmbraClient } from '@umbra-privacy/sdk';
import type { IUmbraClient } from '@umbra-privacy/sdk/interfaces';
import type { UmbraNetwork } from './types.js';

export interface OnyxUmbraConfig {
  signer: any;
  network?: UmbraNetwork;
  rpcUrl?: string;
  rpcSubscriptionsUrl?: string;
  indexerApiEndpoint?: string;
  deferMasterSeedSignature?: boolean;
}

const DEVNET_RPC = 'https://api.devnet.solana.com';
const DEVNET_WS = 'wss://api.devnet.solana.com';
const DEVNET_INDEXER = 'https://utxo-indexer.api-devnet.umbraprivacy.com';

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const MAINNET_WS = 'wss://api.mainnet-beta.solana.com';
const MAINNET_INDEXER = 'https://utxo-indexer.api.umbraprivacy.com';

export async function createUmbraClient(config: OnyxUmbraConfig): Promise<IUmbraClient> {
  const network = (config.network
    ?? (process.env['UMBRA_NETWORK'] as UmbraNetwork | undefined)
    ?? 'devnet') as UmbraNetwork;

  const isDevnet = network === 'devnet' || network === 'localnet';

  const rpcUrl = config.rpcUrl
    ?? process.env['UMBRA_RPC_URL']
    ?? (isDevnet ? DEVNET_RPC : MAINNET_RPC);

  const rpcSubscriptionsUrl = config.rpcSubscriptionsUrl
    ?? process.env['UMBRA_RPC_WS_URL']
    ?? (isDevnet ? DEVNET_WS : MAINNET_WS);

  const indexerApiEndpoint = config.indexerApiEndpoint
    ?? process.env['UMBRA_INDEXER_ENDPOINT']
    ?? (isDevnet ? DEVNET_INDEXER : MAINNET_INDEXER);

  if (!config.signer) {
    throw new Error(
      '[onyx-privacy] No signer provided. Pass a wallet adapter or call createInMemorySigner() from @umbra-privacy/sdk.',
    );
  }

  return getUmbraClient({
    signer: config.signer,
    network,
    rpcUrl,
    rpcSubscriptionsUrl,
    indexerApiEndpoint,
    deferMasterSeedSignature: config.deferMasterSeedSignature,
  });
}

export type UmbraClient = IUmbraClient;