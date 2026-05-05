import { address, Address, Rpc, SolanaRpcApi, fetchEncodedAccount } from '@solana/kit'
import {
  ENCRYPT_PROGRAM_ID, ENCRYPT_CPI_SEED, ENCRYPT_CONFIG_SEED,
  ENCRYPT_DEPOSIT_SEED, ENCRYPT_EVENT_AUTHORITY_SEED,
  ENCRYPT_NETWORK_KEY_SEED
} from './program-id'

export interface EncryptContextAccounts {
  encryptProgram:       Address
  config:               Address
  deposit:              Address
  cpiAuthority:         Address
  callerProgram:        Address
  networkEncryptionKey: Address
  payer:                Address
  eventAuthority:       Address
  systemProgram:        Address
  cpiAuthorityBump:     number
}

export async function buildEncryptContext(
  rpc: Rpc<SolanaRpcApi>,
  callerProgramId: Address,
  payer: Address
): Promise<EncryptContextAccounts> {
  const encryptProgram = address(ENCRYPT_PROGRAM_ID)
  const callerProgram = address(callerProgramId)
  const payerPk = address(payer)
  
  const { getProgramDerivedAddress, getAddressEncoder } = await import('@solana/addresses');

  const [config] = await getProgramDerivedAddress({
    programAddress: encryptProgram,
    seeds: [new TextEncoder().encode('encrypt_config')],
  });

  // The network key bytes are used as a seed for the network_encryption_key PDA.
  // In pre-alpha, the devnet network key is a known constant (32 bytes of 0x55).
  // We verify the config account exists first, then use the known key.
  const configAccount = await fetchEncodedAccount(rpc, config)
  if (!configAccount.exists) throw new Error('EncryptConfig not found')
  // Use the documented devnet network encryption key constant
  const { DEVNET_NETWORK_KEY } = await import('./program-id.js')
  const networkKey = new Uint8Array(DEVNET_NETWORK_KEY)

  const [deposit] = await getProgramDerivedAddress({
    programAddress: encryptProgram,
    seeds: [new TextEncoder().encode('encrypt_deposit'), getAddressEncoder().encode(payerPk)],
  });

  const [cpiAuthority, cpiAuthorityBump] = await getProgramDerivedAddress({
    programAddress: callerProgram,
    seeds: [new TextEncoder().encode('__encrypt_cpi_authority')],
  });

  const [networkEncryptionKey] = await getProgramDerivedAddress({
    programAddress: encryptProgram,
    seeds: [new TextEncoder().encode('network_encryption_key'), networkKey],
  });

  const [eventAuthority] = await getProgramDerivedAddress({
    programAddress: encryptProgram,
    seeds: [new TextEncoder().encode('__event_authority')],
  });

  const systemProgram = address('11111111111111111111111111111111')

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