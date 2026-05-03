export const ENCRYPT_PROGRAM_ID = '4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8'
export const ONYX_FHE_VAULT_PROGRAM_ID = '8tsJQaXZQGRdwUo28dicc9XwSMuCkbeiRvr9KYGcWpFs'
export const ENCRYPT_GRPC = process.env.ENCRYPT_GRPC_ENDPOINT
  ?? 'pre-alpha-dev-1.encrypt.ika-network.net:443'
export const ENCRYPT_CPI_SEED = Buffer.from('__encrypt_cpi_authority')
export const ENCRYPT_CONFIG_SEED = Buffer.from('encrypt_config')
export const ENCRYPT_DEPOSIT_SEED = Buffer.from('encrypt_deposit')
export const ENCRYPT_EVENT_AUTHORITY_SEED = Buffer.from('__event_authority')
export const ENCRYPT_NETWORK_KEY_SEED = Buffer.from('network_encryption_key')
export const DEVNET_NETWORK_KEY = Buffer.alloc(32, 0x55)