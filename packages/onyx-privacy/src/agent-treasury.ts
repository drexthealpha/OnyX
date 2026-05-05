import { getEncryptedBalanceQuerierFunction } from '@umbra-privacy/sdk';
import type { Address, U64, DepositResult, WithdrawResult } from './types.js';
import type { UmbraClient } from './client.js';
import { shieldAsset } from './shield.js';
import { unshieldAsset } from './unshield.js';

export class OnyxAgentTreasury {
  private client: UmbraClient;
  private autoshieldThreshold: U64;
  private treasuryAddress: Address;

  constructor(client: UmbraClient, config?: { autoshieldThreshold?: bigint; treasuryAddress?: string }) {
    this.client = client;
    this.autoshieldThreshold = config?.autoshieldThreshold ? BigInt(config.autoshieldThreshold) as U64 : 0n as U64;
    this.treasuryAddress = (config?.treasuryAddress ?? client.signer.address) as Address;
  }

  async onReceive(mint: Address, amount: U64): Promise<DepositResult> {
    if (amount > this.autoshieldThreshold) {
      return shieldAsset(this.client, mint, amount, this.treasuryAddress);
    }
    return {
      queueSignature: 'no_shield_needed',
      callbackSignature: 'no_shield_needed',
    };
  }

  async pay(mint: Address, amount: U64, destination: Address): Promise<WithdrawResult> {
    return unshieldAsset(this.client, mint, amount, destination);
  }

  async getEncryptedBalance(mint: Address): Promise<bigint> {
    const query = getEncryptedBalanceQuerierFunction({ client: this.client });
    const result = await query([mint]);
    const mintResult = result.get(mint);
    if (mintResult?.state === 'shared') {
      return mintResult.balance;
    }
    return 0n;
  }

  async shield(mint: Address, amount: U64): Promise<DepositResult> {
    return shieldAsset(this.client, mint, amount, this.treasuryAddress);
  }

  async unshield(mint: Address, amount: U64, destination: Address): Promise<WithdrawResult> {
    return unshieldAsset(this.client, mint, amount, destination);
  }
}