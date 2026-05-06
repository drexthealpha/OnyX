#!/usr/bin/env tsx
/**
 * ONYX IKA DEMO
 * Demonstrates keyless dWallet signing on Solana devnet.
 * The agent signs a transaction without the private key ever entering memory.
 * 
 * Run: pnpm demo:ika
 */
import { createDWallet, signMessage } from '../packages/onyx-bridge/src/index.js';
import { Curve, SignatureScheme } from '../packages/onyx-bridge/src/types.js';

async function main() {
  console.log('\n🔐 ONYX Keyless Signing Demo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Network: Solana Devnet');
  console.log('Ika Endpoint:', process.env.IKA_GRPC_ENDPOINT || 'pre-alpha-dev-1.ika.ika-network.net:443');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Step 1: Creating dWallet via Ika DKG...');
  const { publicKey, dwalletId } = await createDWallet(Curve.Secp256k1);
  console.log('✅ dWallet created');
  console.log('   dWallet ID:', dwalletId);
  console.log('   Public Key:', Buffer.from(publicKey).toString('hex'));
  console.log('   Explorer:  https://explorer.solana.com/address/' + dwalletId + '?cluster=devnet\n');

  console.log('Step 2: Signing a message (private key NEVER in memory)...');
  const message = new TextEncoder().encode('ONYX keyless signing proof — ' + new Date().toISOString());
  const signature = await signMessage(dwalletId, message, SignatureScheme.EcdsaKeccak256);
  console.log('✅ Message signed');
  console.log('   Signature:', Buffer.from(signature).toString('hex').slice(0, 64) + '...');
  console.log('\n🎯 Private key was never loaded into this process memory.');
  console.log('   Signing happened across the Ika distributed network.\n');
}

main().catch(console.error);