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
    console.debug('[onyx-privacy] Getting private balance for mint:', mint.substring(0, 16) + '...');
    return 0n;
  }

  async deposit(mint: Address, amount: U64): Promise<DepositResult> {
    return shieldAsset(this.client, mint, amount, 'mock_destination' as Address);
  }

  async withdraw(mint: Address, amount: U64, destination: Address): Promise<WithdrawResult> {
    return unshieldAsset(this.client, mint, amount, destination);
  }

  async transfer(mint: Address, amount: U64, recipient: Address): Promise<string[]> {
    return createReceiverClaimableUtxoFromPublicBalance(
      this.client,
      null as unknown as unknown,
      {
        destinationAddress: recipient,
        mint,
        amount,
      },
    );
  }

  async getStatement(startTs: number, endTs: number): Promise<ComplianceReport> {
    const walletPublicKey = 'mock_wallet_public_key';
    return generateComplianceReport(this.client, walletPublicKey, startTs, endTs);
  }
}