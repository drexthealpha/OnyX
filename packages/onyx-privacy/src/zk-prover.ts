import { wrap } from 'comlink';

export async function getZkProver() {
  if (typeof window !== 'undefined' && window.Worker) {
    const worker = new Worker(new URL('./zk-worker.ts', import.meta.url), {
      type: 'module'
    });
    return wrap(worker);
  } else {
    // Fallback for Node.js environments (CLI, testing)
    return import('@umbra-privacy/web-zk-prover');
  }
}
