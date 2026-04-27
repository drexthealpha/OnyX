// packages/onyx-sdk/src/tests/sdk.test.ts
import { describe, it, expect } from 'vitest';

describe('S32 — OnyxClient', () => {
  // Test 1: OnyxClient instantiates without error
  it('instantiates without error given valid config', async () => {
    const { OnyxClient } = await import('../client.js');
    const client = new OnyxClient({
      nerveUrl: 'http://localhost:3001',
      walletPath: '/tmp/wallet.json',
      network: 'devnet',
    });
    expect(client).toBeDefined();
    expect(client.config.network).toBe('devnet');
    expect(client.config.nerveUrl).toBe('http://localhost:3001');
  });

  // Test 2: Utility functions are callable and return expected shapes
  it('utility functions are callable and return expected shapes', async () => {
    const { solToLamports, lamportsToSol, usdToUsdcLamports, shortenAddress, isValidSolanaAddress } =
      await import('../utils/solana.js');

    expect(solToLamports(1)).toBe(1_000_000_000n);
    expect(lamportsToSol(1_000_000_000n)).toBe(1);
    expect(usdToUsdcLamports(1)).toBe(1_000_000n);
    expect(shortenAddress('So11111111111111111111111111111111111111111112')).toMatch(/^So11\.\.\./);
    expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
    expect(isValidSolanaAddress('not-valid!')).toBe(false);

    const { sha256, hmacSha256, deriveKey, randomHex, safeEqual } = await import('../utils/crypto.js');
    const hash = sha256('hello');
    expect(hash).toHaveLength(64); // 32 bytes hex
    expect(hmacSha256('secret', 'data')).toHaveLength(64);
    expect(deriveKey('a'.repeat(64), 'onyx/agent/0')).toHaveLength(64);
    expect(randomHex(16)).toHaveLength(32);
    expect(safeEqual(Buffer.from('abc'), Buffer.from('abc'))).toBe(true);
    expect(safeEqual(Buffer.from('abc'), Buffer.from('def'))).toBe(false);
  });

  // Test 3: Stubs are properly exported
  it('stubs are properly exported', async () => {
    const stubs = await import('../stubs/index.js');
    expect(typeof stubs.createOnyxRuntime).toBe('function');
    expect(typeof stubs.runResearch).toBe('function');
    expect(typeof stubs.runIntel).toBe('function');
    expect(typeof stubs.runAnalysis).toBe('function');
    expect(typeof stubs.getCompute).toBe('function');
    expect(typeof stubs.createUmbraClient).toBe('function');
  });
});