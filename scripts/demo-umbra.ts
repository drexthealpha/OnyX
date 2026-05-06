#!/usr/bin/env tsx
/**
 * ONYX UMBRA DEMO
 * Demonstrates private stealth transactions on Solana devnet.
 * Amount and recipient are hidden from the public ledger.
 * 
 * Run: pnpm demo:umbra
 */
import { createUmbraClient } from '../packages/onyx-privacy/src/client.js';
import { shieldAsset } from '../packages/onyx-privacy/src/shield.js';

const TEST_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as any;
const AMOUNT = BigInt(1_000_000) as any;

async function main() {
  console.log('\n🔒 ONYX Private Transaction Demo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Network:', process.env.UMBRA_NETWORK || 'devnet');
  console.log('Program:', 'DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = await createUmbraClient({});
  const destination = (client as any).signer.address;

  console.log('Step 1: Ensuring registration with Umbra network...');
  console.log('Step 2: Shielding 1 USDC (awaitCallback: false for demo speed)...');
  
  const receipt = await shieldAsset(client as any, TEST_MINT, AMOUNT, destination, true);
  
  console.log('✅ Shield transaction submitted');
  console.log('   Queue Signature:', (receipt as any).queueSignature);
  console.log('   Explorer: https://explorer.solana.com/tx/' + (receipt as any).queueSignature + '?cluster=devnet');
  console.log('\n🎯 Amount and recipient are hidden on-chain.');
  console.log('   Nobody watching the blockchain can see what was sent or to whom.\n');
}

main().catch(console.error);