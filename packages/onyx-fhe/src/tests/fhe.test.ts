import { describe, test, expect } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { calculateFee, parseDecryptionRequest, verifyDigest } from '../index'
import { buildEncryptContext } from '../encrypt-context'

describe('FHE Fee Calculation', () => {
  test('calculateFee matches ENC formula', () => {
    const fee = calculateFee({
      numInputs:          3,
      numPlaintextInputs: 0,
      numConstants:       0,
      numOutputs:         2,
      numOps:             4,
      feeParams: {
        encPerInput:  1n,
        encPerOutput: 1n,
        maxEncPerOp:  1n,
      }
    })
    expect(fee).toBe(9n)
  })

  test('calculateFee with all zero params returns 0', () => {
    const fee = calculateFee({
      numInputs:          0,
      numPlaintextInputs: 0,
      numConstants:       0,
      numOutputs:         0,
      numOps:             0,
      feeParams: {
        encPerInput:  0n,
        encPerOutput: 0n,
        maxEncPerOp:  0n,
      }
    })
    expect(fee).toBe(0n)
  })

  test('calculateFee with large values', () => {
    const fee = calculateFee({
      numInputs:          10,
      numPlaintextInputs: 5,
      numConstants:       3,
      numOutputs:         4,
      numOps:             20,
      feeParams: {
        encPerInput:  1000n,
        encPerOutput: 2000n,
        maxEncPerOp:  500n,
      }
    })
    const totalInputs = 10 + 5 + 3
    expect(fee).toBe(1000n * BigInt(totalInputs) + 2000n * 4n + 500n * 20n)
  })
})

describe('EncryptContext', () => {
  test('buildEncryptContext returns all 11 account fields', async () => {
    const ctx = await buildEncryptContext(
      '4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8',
      'So11111111111111111111111111111111111111112'
    )
    const fields = [
      'encryptProgram', 'config', 'deposit', 'cpiAuthority',
      'callerProgram', 'networkEncryptionKey', 'payer',
      'eventAuthority', 'systemProgram', 'cpiAuthorityBump'
    ]
    for (const f of fields) {
      expect(ctx[f as keyof typeof ctx]).toBeDefined()
    }
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from('__encrypt_cpi_authority')],
      new PublicKey('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8')
    )
    expect(ctx.cpiAuthority.toBase58()).toBe(expected.toBase58())
  })

  test('buildEncryptContext derives correct PDAs', async () => {
    const ctx = await buildEncryptContext(
      '4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8',
      'So11111111111111111111111111111111111111112'
    )
    expect(ctx.encryptProgram.toBase58()).toBe('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8')
    expect(ctx.systemProgram.toBase58()).toBe('11111111111111111111111111111111')
  })
})

describe('Sealed Bid Digest', () => {
  function buildMockDecryptionRequest(digest: Buffer, result: bigint): Buffer {
    const buf = Buffer.alloc(115)
    buf.writeUInt8(6, 0)
    buf.writeUInt8(1, 1)
    buf.set(digest, 2)
    buf.writeUInt32LE(0, 34)
    buf.writeUInt32LE(0, 66)
    buf.writeUInt32LE(0, 98)
    buf.writeUInt8(4, 98)
    buf.writeUInt32LE(16, 99)
    buf.writeUInt32LE(16, 103)
    buf.writeBigUInt64LE(result, 107)
    return buf
  }

  test('parseDecryptionRequest extracts result correctly', () => {
    const realDigest = Buffer.alloc(32, 0xAB)
    const parsed = parseDecryptionRequest(buildMockDecryptionRequest(realDigest, 42n))
    expect(parsed.result).toBe(42n)
    expect(parsed.bytesWritten).toBe(16)
    expect(parsed.totalLen).toBe(16)
  })

  test('parseDecryptionRequest returns null for incomplete request', () => {
    const realDigest = Buffer.alloc(32, 0xAB)
    const buf = Buffer.alloc(115)
    buf.writeUInt8(6, 0)
    buf.writeUInt8(1, 1)
    buf.set(realDigest, 2)
    buf.writeUInt32LE(0, 34)
    buf.writeUInt32LE(0, 66)
    buf.writeUInt32LE(0, 98)
    buf.writeUInt8(4, 98)
    buf.writeUInt32LE(16, 99)
    buf.writeUInt32LE(8, 103)
    const parsed = parseDecryptionRequest(buf)
    expect(parsed.result).toBeNull()
  })

  test('verifyDigest rejects digest mismatch', () => {
    const realDigest = Buffer.alloc(32, 0xAB)
    const wrongDigest = Buffer.alloc(32, 0xCD)
    expect(() => verifyDigest(realDigest, wrongDigest)).toThrow()
  })

  test('verifyDigest accepts matching digest', () => {
    const realDigest = Buffer.alloc(32, 0xAB)
    expect(() => verifyDigest(realDigest, realDigest)).not.toThrow()
  })
})