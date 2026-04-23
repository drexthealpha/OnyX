import type { Address, U64, DepositResult, WithdrawResult } from './types.js';
import type { UmbraClient } from './client.js';
import { shieldAsset } from './shield.js';
import { unshieldAsset } from './unshield.js';

export class OnyxAgentTreasury {
  private client: UmbraClient;
  private autoshieldThreshold: bigint;

  constructor(client: UmbraClient, config?: { autoshieldThreshold?: bigint }) {
    this.client = client;
    this.autoshieldThreshold = config?.autoshieldThreshold ?? 0n;
  }

  async onReceive(mint: Address, amount: U64): Promise<DepositResult> {
    if (amount > this.autoshieldThreshold) {
      return shieldAsset(this.client, mint, amount, 'treasury_destination' as Address);
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
    console.debug('[onyx-privacy] Getting encrypted balance for mint:', mint.substring(0, 16) + '...');
    return 0n;
  }

  async shield(mint: Address, amount: U64): Promise<DepositResult> {
    return shieldAsset(this.client, mint, amount, 'treasury_destination' as Address);
  }

  async unshield(mint: Address, amount: U64, destination: Address): Promise<WithdrawResult> {
    return unshieldAsset(this.client, mint, amount, destination);
  }
}