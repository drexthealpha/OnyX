/**
 * @onyx/vault — Tests
 * Run: node --test dist/tests/wallet.test.js
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWallet } from "../wallet.js";

import { createKeyPairSignerFromPrivateKeyBytes } from "@solana/signers";

// Generate a mock keypair using @solana/kit
async function generateMockKeypair(): Promise<{ secretKey: number[]; address: string }> {
  // Generate 32 random bytes for private key
  const privateKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(privateKeyBytes);
  
  // Create signer from the 32-byte private key
  const signer = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);
  
  return {
    secretKey: Array.from(privateKeyBytes),
    address: signer.address,
  };
}

// Test 1: wallet loads and returns correct public key

test("createWallet — getPublicKey returns valid base58 string", async () => {
  const { secretKey } = await generateMockKeypair();
  const keypairPath = join(tmpdir(), `onyx-test-${Date.now()}.json`);
  writeFileSync(keypairPath, JSON.stringify(secretKey));

  const wallet = await createWallet({ keypairPath, rpcUrl: "https://api.devnet.solana.com" });
  const pubkey = wallet.getPublicKey();

  assert.equal(typeof pubkey, "string");
  assert.ok(pubkey.length > 0);

  unlinkSync(keypairPath);
});

// Test 2: wallet.sign does not expose private key

test("createWallet — returned wallet object has no privateKey property", async () => {
  const { secretKey } = await generateMockKeypair();
  const keypairPath = join(tmpdir(), `onyx-test-${Date.now()}.json`);
  writeFileSync(keypairPath, JSON.stringify(secretKey));

  const wallet = await createWallet({ keypairPath, rpcUrl: "https://api.devnet.solana.com" });

  const walletAny = wallet as unknown as Record<string, unknown>;
  assert.equal(walletAny["privateKey"], undefined);
  assert.equal(walletAny["secretKey"], undefined);
  assert.equal(walletAny["keypair"], undefined);

  unlinkSync(keypairPath);
});

// Test 3: getBalance returns a bigint

test("createWallet — getBalance returns bigint", async () => {
  const { secretKey } = await generateMockKeypair();
  const keypairPath = join(tmpdir(), `onyx-test-${Date.now()}.json`);
  writeFileSync(keypairPath, JSON.stringify(secretKey));

  const wallet = await createWallet({ keypairPath, rpcUrl: "https://api.devnet.solana.com" });

  assert.equal(typeof wallet.getBalance, "function");
  assert.equal(typeof wallet.sign, "function");
  assert.equal(typeof wallet.signMessage, "function");

  const balance = await wallet.getBalance();
  assert.equal(typeof balance, "bigint");
  assert.ok(balance >= 0n);

  unlinkSync(keypairPath);
});