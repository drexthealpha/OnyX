import { getEncryptedBalanceQuerierFunction } from '@umbra-privacy/sdk';
import type { Address, U64, DepositResult, WithdrawResult, ComplianceReport } from './types.js';
import type { UmbraClient } from './client.js';
import { shieldAsset } from './shield.js';
import { unshieldAsset } from './unshield.js';
import { createReceiverClaimableUtxoFromPublicBalance } from './utxo-create.js';
import { generateComplianceReport } from './compliance.js';

export class OnyxNeobank {
  private client: UmbraClient;

  constructor(client: UmbraClient) {
    this.client = client;
  }

  async getPrivateBalance(mint: Address): Promise<bigint> {
    const query = getEncryptedBalanceQuerierFunction({ client: this.client });
    const result = await query([mint]);
    const mintResult = result.get(mint);
    if (mintResult?.state === 'shared') {
      return mintResult.balance;
    }
    return 0n;
  }

  async deposit(mint: Address, amount: U64): Promise<DepositResult> {
    return shieldAsset(this.client, mint, amount, this.client.signer.address as Address);
  }

  async withdraw(mint: Address, amount: U64, destination: Address): Promise<WithdrawResult> {
    return unshieldAsset(this.client, mint, amount, destination);
  }

  async transfer(mint: Address, amount: U64, recipient: Address): Promise<string[]> {
    const zkProver = (await import('./zk-prover.js')).getZkProvers();
    const provers = await zkProver;
    
    return createReceiverClaimableUtxoFromPublicBalance(
      this.client,
      provers.createReceiverClaimableUtxoFromPublicBalance,
      {
        destinationAddress: recipient,
        mint,
        amount,
      },
    );
  }

  async getStatement(startTs: number, endTs: number): Promise<ComplianceReport> {
    return generateComplianceReport(this.client, '', startTs, endTs);
  }
}