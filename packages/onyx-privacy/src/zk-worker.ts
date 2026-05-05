import { expose } from 'comlink';
import * as prover from '@umbra-privacy/web-zk-prover';

const worker = {
  async proveGroth16(inputs: unknown, wasmData: Uint8Array, zkeyData: Uint8Array) {
    return prover.proveGroth16(inputs, wasmData, zkeyData);
  },
  async getCreateSelfClaimableUtxoFromEncryptedBalanceProver() {
    return prover.getCreateSelfClaimableUtxoFromEncryptedBalanceProver();
  }
};

expose(worker);
