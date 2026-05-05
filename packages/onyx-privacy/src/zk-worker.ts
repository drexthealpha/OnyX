import { expose } from 'comlink';
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

const worker = {
  getUserRegistrationProver,
  getCreateSelfClaimableUtxoFromEncryptedBalanceProver,
  getCreateReceiverClaimableUtxoFromEncryptedBalanceProver,
  getCreateSelfClaimableUtxoFromPublicBalanceProver,
  getCreateReceiverClaimableUtxoFromPublicBalanceProver,
  getSelfClaimableUtxoToEncryptedBalanceClaimerProver,
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver,
  getSelfClaimableUtxoToPublicBalanceClaimerProver,
};

expose(worker);