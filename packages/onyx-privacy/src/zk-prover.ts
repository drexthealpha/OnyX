import {
  getUserRegistrationProver,
  getCreateSelfClaimableUtxoFromEncryptedBalanceProver,
  getCreateReceiverClaimableUtxoFromEncryptedBalanceProver,
  getCreateSelfClaimableUtxoFromPublicBalanceProver,
  getCreateReceiverClaimableUtxoFromPublicBalanceProver,
  getSelfClaimableUtxoToEncryptedBalanceClaimerProver,
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver,
  getSelfClaimableUtxoToPublicBalanceClaimerProver,
} from '@umbra-privacy/web-zk-prover';

export interface ZkProvers {
  userRegistration: ReturnType<typeof getUserRegistrationProver>;
  createSelfClaimableUtxoFromEncryptedBalance: ReturnType<typeof getCreateSelfClaimableUtxoFromEncryptedBalanceProver>;
  createReceiverClaimableUtxoFromEncryptedBalance: ReturnType<typeof getCreateReceiverClaimableUtxoFromEncryptedBalanceProver>;
  createSelfClaimableUtxoFromPublicBalance: ReturnType<typeof getCreateSelfClaimableUtxoFromPublicBalanceProver>;
  createReceiverClaimableUtxoFromPublicBalance: ReturnType<typeof getCreateReceiverClaimableUtxoFromPublicBalanceProver>;
  claimSelfClaimableToEncryptedBalance: ReturnType<typeof getSelfClaimableUtxoToEncryptedBalanceClaimerProver>;
  claimReceiverClaimableToEncryptedBalance: ReturnType<typeof getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver>;
  claimSelfClaimableToPublicBalance: ReturnType<typeof getSelfClaimableUtxoToPublicBalanceClaimerProver>;
}

export async function getZkProvers(): Promise<ZkProvers> {
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    const { wrap } = await import('comlink');
    const worker = new Worker(new URL('./zk-worker.ts', import.meta.url), {
      type: 'module'
    });
    return wrap(worker);
  }

  return {
    userRegistration: getUserRegistrationProver(),
    createSelfClaimableUtxoFromEncryptedBalance: getCreateSelfClaimableUtxoFromEncryptedBalanceProver(),
    createReceiverClaimableUtxoFromEncryptedBalance: getCreateReceiverClaimableUtxoFromEncryptedBalanceProver(),
    createSelfClaimableUtxoFromPublicBalance: getCreateSelfClaimableUtxoFromPublicBalanceProver(),
    createReceiverClaimableUtxoFromPublicBalance: getCreateReceiverClaimableUtxoFromPublicBalanceProver(),
    claimSelfClaimableToEncryptedBalance: getSelfClaimableUtxoToEncryptedBalanceClaimerProver(),
    claimReceiverClaimableToEncryptedBalance: getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver(),
    claimSelfClaimableToPublicBalance: getSelfClaimableUtxoToPublicBalanceClaimerProver(),
  };
}