import { 
  createSolanaRpc, 
  address, 
  Address, 
  Rpc, 
  SolanaRpcApi 
} from '@solana/kit';

export interface SolanaClient {
  rpc: Rpc<SolanaRpcApi>;
  // Add other properties if needed, e.g. plugins
}

export function createSolanaClient(options: { rpcEndpoint: string }): SolanaClient {
  return {
    rpc: createSolanaRpc(options.rpcEndpoint),
  };
}
