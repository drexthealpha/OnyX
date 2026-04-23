import { getUmbraRelayer } from '@umbra-privacy/sdk';
import type { ClaimResult } from './types.js';

export interface OnyxRelayer {
  apiEndpoint: string;
}

export function getOnyxRelayer(endpoint: string): OnyxRelayer {
  return {
    apiEndpoint: endpoint,
  };
}

interface RelayerStatusResponse {
  status: string;
  signature?: string;
  error?: string;
}

const LIFECYCLE_STATUSES = [
  'received',
  'validating',
  'offsets_reserved',
  'building_tx',
  'tx_built',
  'submitting',
  'submitted',
  'awaiting_callback',
  'callback_received',
  'finalizing',
  'completed',
  'failed',
  'timed_out',
] as const;

const POLL_INTERVAL_MS = 3000;
const TOTAL_TIMEOUT_MS = 120000;
const MAX_POLLS = Math.ceil(TOTAL_TIMEOUT_MS / POLL_INTERVAL_MS);

export async function pollUntilComplete(
  relayer: OnyxRelayer,
  requestId: string,
): Promise<ClaimResult> {
  const startTime = Date.now();
  let lastStatus = '';
  let pollCount = 0;

  while (pollCount < MAX_POLLS) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= TOTAL_TIMEOUT_MS) {
      throw new Error(`[onyx-privacy] Relayer claim timed out: ${requestId}`);
    }

    try {
      const response = await fetch(`${relayer.apiEndpoint}/v1/claims/${requestId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`[onyx-privacy] Relayer API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as RelayerStatusResponse;
      const currentStatus = data.status;

      if (currentStatus !== lastStatus) {
        console.debug(`[onyx-privacy] Relayer status: ${lastStatus} -> ${currentStatus}`);
        lastStatus = currentStatus;
      }

      if (currentStatus === 'completed') {
        const elapsedMs = Date.now() - startTime;
        return {
          requestId,
          status: 'completed',
          signature: data.signature,
          elapsedMs,
        };
      }

      if (currentStatus === 'failed') {
        throw new Error(`[onyx-privacy] Relayer claim failed: ${requestId} - ${data.error ?? 'unknown error'}`);
      }

      if (currentStatus === 'timed_out') {
        throw new Error(`[onyx-privacy] Relayer claim timed out: ${requestId}`);
      }

      const isTerminal = !LIFECYCLE_STATUSES.includes(currentStatus as typeof LIFECYCLE_STATUSES[number])
        && !currentStatus.startsWith('awaiting');

      if (isTerminal && !LIFECYCLE_STATUSES.includes(currentStatus as typeof LIFECYCLE_STATUSES[number])) {
        if (currentStatus !== 'received' &&
            currentStatus !== 'validating' &&
            currentStatus !== 'offsets_reserved' &&
            currentStatus !== 'building_tx' &&
            currentStatus !== 'tx_built' &&
            currentStatus !== 'submitting' &&
            currentStatus !== 'submitted' &&
            currentStatus !== 'awaiting_callback' &&
            currentStatus !== 'callback_received' &&
            currentStatus !== 'finalizing') {
          throw new Error(`[onyx-privacy] Relayer claim unexpected status: ${currentStatus}`);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('[onyx-privacy]')) {
        throw err;
      }
      console.debug(`[onyx-privacy] Relayer poll error: ${err instanceof Error ? err.message : String(err)}`);
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    pollCount++;
  }

  throw new Error(`[onyx-privacy] Relayer claim timed out: ${requestId}`);
}