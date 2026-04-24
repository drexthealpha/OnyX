// packages/onyx-bridge/tests/bridge.test.ts

import { describe, it, expect } from 'vitest';

describe('Curve Enum', () => {
  it('has correct values', async () => {
    const { Curve } = await import('../src/types');
    
    expect(Curve.Secp256k1).toBe(0);
    expect(Curve.Secp256r1).toBe(1);
    expect(Curve.Curve25519).toBe(2);
    expect(Curve.Ristretto).toBe(3);
  });
});

describe('SignatureScheme Enum', () => {
  it('has correct values', async () => {
    const { SignatureScheme } = await import('../src/types');
    
    expect(SignatureScheme.EcdsaKeccak256).toBe(0);
    expect(SignatureScheme.EcdsaSha256).toBe(1);
    expect(SignatureScheme.EcdsaDoubleSha256).toBe(2);
    expect(SignatureScheme.TaprootSha256).toBe(3);
    expect(SignatureScheme.EcdsaBlake2b256).toBe(4);
    expect(SignatureScheme.EddsaSha512).toBe(5);
    expect(SignatureScheme.SchnorrkelMerlin).toBe(6);
  });
});

describe('SignatureAlgorithm Enum', () => {
  it('has correct values', async () => {
    const { SignatureAlgorithm } = await import('../src/types');
    
    expect(SignatureAlgorithm.ECDSASecp256k1).toBe(0);
    expect(SignatureAlgorithm.ECDSASecp256r1).toBe(1);
    expect(SignatureAlgorithm.Taproot).toBe(2);
    expect(SignatureAlgorithm.EdDSA).toBe(3);
    expect(SignatureAlgorithm.SchnorrkelSubstrate).toBe(4);
  });
});

describe('Constants', () => {
  it('has correct CPI_AUTHORITY_SEED', async () => {
    const { CPI_AUTHORITY_SEED } = await import('../src/types');
    
    const expected = '__ika_cpi_authority';
    expect(CPI_AUTHORITY_SEED.toString('utf8')).toBe(expected);
  });
  
  it('has correct IKA_PROGRAM_ID', async () => {
    const { IKA_PROGRAM_ID } = await import('../src/types');
    
    expect(IKA_PROGRAM_ID).toBe('87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY');
  });
  
  it('has default endpoints', async () => {
    const { IKA_GRPC_ENDPOINT, SOLANA_RPC_ENDPOINT, BUDGET_CAP, STATUS_PENDING, STATUS_SIGNED } = await import('../src/types');
    
    expect(IKA_GRPC_ENDPOINT).toContain('ika');
    expect(SOLANA_RPC_ENDPOINT).toContain('solana');
    expect(BUDGET_CAP).toBeGreaterThan(0n);
    expect(STATUS_PENDING).toBe(0);
    expect(STATUS_SIGNED).toBe(1);
  });
  
  it('has correct discriminators', async () => {
    const { DISC_COORDINATOR, DISC_DWALLET, DISC_NEK, DISC_GAS_DEPOSIT, DISC_MESSAGE_APPROVAL } = await import('../src/types');
    
    expect(DISC_COORDINATOR).toBe(1);
    expect(DISC_DWALLET).toBe(2);
    expect(DISC_NEK).toBe(3);
    expect(DISC_GAS_DEPOSIT).toBe(4);
    expect(DISC_MESSAGE_APPROVAL).toBe(14);
  });
  
  it('has account lengths', async () => {
    const { COORDINATOR_LEN, NEK_LEN, DWALLET_LEN, GAS_DEPOSIT_LEN, MESSAGE_APPROVAL_LEN } = await import('../src/types');
    
    expect(COORDINATOR_LEN).toBe(116);
    expect(NEK_LEN).toBe(164);
    expect(DWALLET_LEN).toBe(153);
    expect(GAS_DEPOSIT_LEN).toBe(139);
    expect(MESSAGE_APPROVAL_LEN).toBe(312);
  });
  
  it('has message approval offsets', async () => {
    const { MSG_APPROVAL_STATUS_OFFSET, MSG_APPROVAL_SIG_LEN_OFFSET, MSG_APPROVAL_SIG_OFFSET } = await import('../src/types');
    
    expect(MSG_APPROVAL_STATUS_OFFSET).toBe(172);
    expect(MSG_APPROVAL_SIG_LEN_OFFSET).toBe(173);
    expect(MSG_APPROVAL_SIG_OFFSET).toBe(175);
  });
});

describe('BCS Type Definitions', () => {
  it('defineBcsTypes function exists', async () => {
    const bcsTypesModule = await import('../src/bcs-types');
    
    expect(typeof bcsTypesModule.defineBcsTypes).toBe('function');
  });
});

describe('Gas Deposit Functions', () => {
  it('has instruction constants', async () => {
    const mod = await import('../src/gas-deposit');
    
    expect(mod.INSTRUCTION_CREATE_DEPOSIT).toBe(36);
    expect(mod.INSTRUCTION_TOP_UP).toBe(37);
    expect(mod.INSTRUCTION_SETTLE_GAS).toBe(38);
    expect(mod.INSTRUCTION_REQUEST_WITHDRAW).toBe(44);
    expect(mod.INSTRUCTION_WITHDRAW).toBe(45);
  });
  
  it('has balance offsets', async () => {
    const { IKA_BALANCE_OFFSET, SOL_BALANCE_OFFSET } = await import('../src/gas-deposit');
    
    expect(IKA_BALANCE_OFFSET).toBe(34);
    expect(SOL_BALANCE_OFFSET).toBe(42);
  });
  
  it('getGasDepositPda exists', async () => {
    const { getGasDepositPda } = await import('../src/gas-deposit');
    
    expect(typeof getGasDepositPda).toBe('function');
  });
});

describe('DWallet Functions', () => {
  it('has dwallet exports', async () => {
    const mod = await import('../src/dwallet');
    
    expect(typeof mod.getDWalletPda).toBe('function');
    expect(typeof mod.waitForCoordinator).toBe('function');
    expect(typeof mod.waitForDWalletOnChain).toBe('function');
    expect(typeof mod.readDWalletAccount).toBe('function');
    expect(typeof mod.createDWallet).toBe('function');
  });
});

describe('Sign Functions', () => {
  it('has sign functions', async () => {
    const mod = await import('../src/sign');
    
    expect(typeof mod.computeMessageDigest).toBe('function');
    expect(typeof mod.computeMessageApprovalPda).toBe('function');
    expect(typeof mod.pollMessageApproval).toBe('function');
    expect(typeof mod.requestPresign).toBe('function');
    expect(typeof mod.signMessage).toBe('function');
    expect(typeof mod.approveMessage).toBe('function');
  });
});

describe('Custody Functions', () => {
  it('has custody functions', async () => {
    const mod = await import('../src/custody');
    
    expect(typeof mod.getCPIAuthority).toBe('function');
    expect(typeof mod.verifyAuthority).toBe('function');
    expect(typeof mod.transferToCPIAuthority).toBe('function');
    expect(typeof mod.readCurrentAuthority).toBe('function');
    expect(typeof mod.isCPIAuthorized).toBe('function');
    expect(typeof mod.batchTransfer).toBe('function');
  });
});

describe('Bridge Functions', () => {
  it('has bridge exports', async () => {
    const { OnyxBridge, bridgeSign, shieldAsset, unshieldAsset } = await import('../src/bridge');
    
    expect(OnyxBridge).toBeDefined();
    expect(typeof bridgeSign).toBe('function');
    expect(typeof shieldAsset).toBe('function');
    expect(typeof unshieldAsset).toBe('function');
  });
});

describe('Passkeys Functions', () => {
  it('has passkey exports', async () => {
    const mod = await import('../src/passkeys');
    
    expect(mod.WEBAUTHN_RP_ID).toBe('localhost');
    expect(mod.WEBAUTHN_RP_NAME).toBe('ONYX');
    expect(typeof mod.derSignatureToRawRS).toBe('function');
    expect(typeof mod.createWebAuthnCredential).toBe('function');
    expect(typeof mod.signWithWebAuthn).toBe('function');
    expect(typeof mod.generateSignedKeypair).toBe('function');
    expect(typeof mod.verifySignature).toBe('function');
  });
});

describe('Shared Access Functions', () => {
  it('has shared access exports', async () => {
    const { SharedAccessManager, grantSharedAccess, revokeSharedAccess, checkSharedAccess } = await import('../src/shared-access');
    
    expect(SharedAccessManager).toBeDefined();
    expect(typeof grantSharedAccess).toBe('function');
    expect(typeof revokeSharedAccess).toBe('function');
    expect(typeof checkSharedAccess).toBe('function');
  });
  
  it('SHARED_ACCESS_PREFIX exists', async () => {
    const { SHARED_ACCESS_PREFIX } = await import('../src/shared-access');
    
    expect(SHARED_ACCESS_PREFIX).toBeDefined();
    expect(SHARED_ACCESS_PREFIX.length).toBeGreaterThan(0);
  });
});

describe('Multisig Functions', () => {
  it('has multisig exports', async () => {
    const { OnyxMultisig, computeMultisigPda, createMultisigTransaction } = await import('../src/multisig');
    
    expect(OnyxMultisig).toBeDefined();
    expect(typeof computeMultisigPda).toBe('function');
    expect(typeof createMultisigTransaction).toBe('function');
  });
});

describe('Spending Limits', () => {
  it('has spending limits export', async () => {
    const { SpendingLimitEnforcer, createSpendingLimiter } = await import('../src/spending-limits');
    
    expect(SpendingLimitEnforcer).toBeDefined();
    expect(typeof createSpendingLimiter).toBe('function');
  });
});

describe('gRPC Client', () => {
  it('has grpc client exports', async () => {
    const mod = await import('../src/grpc-client');
    
    expect(typeof mod.createGrpcClient).toBe('function');
    expect(mod.GrpcClient).toBeDefined();
  });
  
  it('buildUserSignature exists', async () => {
    const { buildUserSignature } = await import('../src/grpc-client');
    
    expect(typeof buildUserSignature).toBe('function');
  });
  
  it('buildSignedRequestData exists', async () => {
    const { buildSignedRequestData } = await import('../src/grpc-client');
    
    expect(typeof buildSignedRequestData).toBe('function');
  });
});

describe('Module Exports', () => {
  it('index exports NAME and VERSION', async () => {
    const { NAME, VERSION } = await import('../src/index');
    
    expect(NAME).toBe('onyx-bridge');
    expect(VERSION).toBe('0.1.0');
  });
  
  it('exports all expected modules', async () => {
    const index = await import('../src/index');
    
    expect(index.Curve).toBeDefined();
    expect(index.SignatureScheme).toBeDefined();
    expect(index.SignatureAlgorithm).toBeDefined();
    expect(index.CPI_AUTHORITY_SEED).toBeDefined();
    expect(index.IKA_PROGRAM_ID).toBeDefined();
    expect(index.GrpcClient).toBeDefined();
    expect(index.createGrpcClient).toBeDefined();
    expect(index.OnyxBridge).toBeDefined();
    expect(index.OnyxMultisig).toBeDefined();
    expect(index.SpendingLimitEnforcer).toBeDefined();
  });
});