import { describe, test, expect } from 'vitest'
import { address } from '@solana/kit'
import { getProgramDerivedAddress } from '@solana/addresses'
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
  const mockRpc = {
    getAccountInfo: () => ({
      send: async () => ({
        value: {
          data: [Buffer.concat([Buffer.from([3, 1]), Buffer.alloc(32, 0x55)]).toString('base64'), 'base64'],
          executable: false,
          lamports: 0,
          owner: '11111111111111111111111111111111'
        }
      })
    })
  } as any

  test('buildEncryptContext returns all 11 account fields', async () => {
    const ctx = await buildEncryptContext(
      mockRpc,
      address('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8'),
      address('So11111111111111111111111111111111111111112')
    )
    const fields = [
      'encryptProgram', 'config', 'deposit', 'cpiAuthority',
      'callerProgram', 'networkEncryptionKey', 'payer',
      'eventAuthority', 'systemProgram', 'cpiAuthorityBump'
    ]
    for (const f of fields) {
      expect(ctx[f as keyof typeof ctx]).toBeDefined()
    }
    const [expected] = await getProgramDerivedAddress({
      programAddress: address('So11111111111111111111111111111111111111112'),
      seeds: [new TextEncoder().encode('__encrypt_cpi_authority')]
    })
    expect(ctx.cpiAuthority).toBe(expected)
  })

  test('buildEncryptContext derives correct PDAs', async () => {
    const ctx = await buildEncryptContext(
      mockRpc,
      address('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8'),
      address('So11111111111111111111111111111111111111112')
    )
    expect(ctx.encryptProgram).toBe('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8')
    expect(ctx.systemProgram).toBe('11111111111111111111111111111111')
  })
})

describe('Sealed Bid Digest', () => {
  function buildMockDecryptionRequest(digest: Uint8Array, result: bigint): Uint8Array {
    const buf = new Uint8Array(115)
    const view = new DataView(buf.buffer)
    view.setUint8(0, 6)
    view.setUint8(1, 1)
    buf.set(digest, 2)
    view.setUint32(34, 0, true)
    view.setUint32(66, 0, true)
    view.setUint32(98, 0, true)
    view.setUint8(98, 4)
    view.setUint32(99, 16, true)
    view.setUint32(103, 16, true)
    view.setBigUint64(107, result, true)
    return buf
  }

  test('parseDecryptionRequest extracts result correctly', () => {
    const realDigest = new Uint8Array(32).fill(0xAB)
    const parsed = parseDecryptionRequest(buildMockDecryptionRequest(realDigest, 42n))
    expect(parsed.result).toBe(42n)
    expect(parsed.bytesWritten).toBe(16)
    expect(parsed.totalLen).toBe(16)
  })

  test('parseDecryptionRequest returns null for incomplete request', () => {
    const realDigest = new Uint8Array(32).fill(0xAB)
    const buf = new Uint8Array(115)
    const view = new DataView(buf.buffer)
    view.setUint8(0, 6)
    view.setUint8(1, 1)
    buf.set(realDigest, 2)
    view.setUint32(34, 0, true)
    view.setUint32(66, 0, true)
    view.setUint32(98, 0, true)
    view.setUint8(98, 4)
    view.setUint32(99, 16, true)
    view.setUint32(103, 8, true)
    const parsed = parseDecryptionRequest(buf)
    expect(parsed.result).toBeNull()
  })

  test('verifyDigest rejects digest mismatch', () => {
    const realDigest = new Uint8Array(32).fill(0xAB)
    const wrongDigest = new Uint8Array(32).fill(0xCD)
    expect(() => verifyDigest(realDigest, wrongDigest)).toThrow()
  })

  test('verifyDigest accepts matching digest', () => {
    const realDigest = new Uint8Array(32).fill(0xAB)
    expect(() => verifyDigest(realDigest, realDigest)).not.toThrow()
  })
})