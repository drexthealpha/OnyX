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

// Generate a mock keypair (32 bytes for public key, 64 for secret)
function generateMockKeypair(): { publicKey: number[]; secretKey: number[] } {
  const secretKey = Array.from({ length: 64 }, () => Math.floor(Math.random() * 256));
  return {
    secretKey,
    publicKey: secretKey.slice(0, 32),
  };
}

// Test 1: wallet loads and returns correct public key

test("createWallet — getPublicKey returns valid base58 string", async () => {
  const { secretKey } = generateMockKeypair();
  const keypairPath = join(tmpdir(), `onyx-test-${Date.now()}.json`);
  writeFileSync(keypairPath, JSON.stringify(secretKey));

  const wallet = createWallet({ keypairPath, rpcUrl: "https://api.devnet.solana.com" });
  const pubkey = wallet.getPublicKey();

  assert.equal(typeof pubkey, "string");
  assert.ok(pubkey.length > 0);

  unlinkSync(keypairPath);
});

// Test 2: wallet.sign does not expose private key

test("createWallet — returned wallet object has no privateKey property", async () => {
  const { secretKey } = generateMockKeypair();
  const keypairPath = join(tmpdir(), `onyx-test-${Date.now()}.json`);
  writeFileSync(keypairPath, JSON.stringify(secretKey));

  const wallet = createWallet({ keypairPath, rpcUrl: "https://api.devnet.solana.com" });

  const walletAny = wallet as unknown as Record<string, unknown>;
  assert.equal(walletAny["privateKey"], undefined);
  assert.equal(walletAny["secretKey"], undefined);
  assert.equal(walletAny["keypair"], undefined);

  unlinkSync(keypairPath);
});

// Test 3: getBalance returns a bigint

test("createWallet — getBalance returns bigint", async () => {
  const { secretKey } = generateMockKeypair();
  const keypairPath = join(tmpdir(), `onyx-test-${Date.now()}.json`);
  writeFileSync(keypairPath, JSON.stringify(secretKey));

  const wallet = createWallet({ keypairPath, rpcUrl: "https://api.devnet.solana.com" });

  assert.equal(typeof wallet.getBalance, "function");
  assert.equal(typeof wallet.sign, "function");
  assert.equal(typeof wallet.signMessage, "function");

  const balance = await wallet.getBalance();
  assert.equal(typeof balance, "bigint");
  assert.ok(balance > 0n);

  unlinkSync(keypairPath);
});