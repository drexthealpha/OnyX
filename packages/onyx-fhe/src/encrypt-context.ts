import { PublicKey } from '@solana/web3.js'
import {
  ENCRYPT_PROGRAM_ID, ENCRYPT_CPI_SEED, ENCRYPT_CONFIG_SEED,
  ENCRYPT_DEPOSIT_SEED, ENCRYPT_EVENT_AUTHORITY_SEED,
  ENCRYPT_NETWORK_KEY_SEED, DEVNET_NETWORK_KEY
} from './program-id'

export interface EncryptContextAccounts {
  encryptProgram:       PublicKey
  config:               PublicKey
  deposit:              PublicKey
  cpiAuthority:         PublicKey
  callerProgram:        PublicKey
  networkEncryptionKey: PublicKey
  payer:                PublicKey
  eventAuthority:       PublicKey
  systemProgram:        PublicKey
  cpiAuthorityBump:     number
}

export async function buildEncryptContext(
  callerProgramId: string,
  payer: string
): Promise<EncryptContextAccounts> {
  const encryptProgram = new PublicKey(ENCRYPT_PROGRAM_ID)
  const callerProgram = new PublicKey(callerProgramId)
  const payerPk = new PublicKey(payer)

  const [config] = PublicKey.findProgramAddressSync(
    [ENCRYPT_CONFIG_SEED],
    encryptProgram
  )

  const [deposit, depositBump] = PublicKey.findProgramAddressSync(
    [ENCRYPT_DEPOSIT_SEED, payerPk.toBuffer()],
    encryptProgram
  )

  const [cpiAuthority, cpiAuthorityBump] = PublicKey.findProgramAddressSync(
    [ENCRYPT_CPI_SEED],
    callerProgram
  )

  const [networkEncryptionKey] = PublicKey.findProgramAddressSync(
    [ENCRYPT_NETWORK_KEY_SEED, DEVNET_NETWORK_KEY],
    encryptProgram
  )

  const [eventAuthority] = PublicKey.findProgramAddressSync(
    [ENCRYPT_EVENT_AUTHORITY_SEED],
    encryptProgram
  )

  const systemProgram = new PublicKey('11111111111111111111111111111111')

  return {
    encryptProgram,
    config,
    deposit,
    cpiAuthority,
    callerProgram,
    networkEncryptionKey,
    payer: payerPk,
    eventAuthority,
    systemProgram,
    cpiAuthorityBump,
  }
}