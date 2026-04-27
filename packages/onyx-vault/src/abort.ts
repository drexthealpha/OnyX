/**
 * @onyx/vault — Abort + Refund wrapper
 *
 * Registers an abort handler BEFORE running any irreversible operation.
 * Clears on success. Fires refund on failure.
 *
 * Apollo-11 law: any irreversible action must be abortable.
 */

const _handlers = new Map<string, () => void>();

function registerAbortHandler(id: string, fn: () => void): void {
  _handlers.set(id, fn);
  process.once("SIGINT", () => {
    const h = _handlers.get(id);
    if (h) { h(); _handlers.delete(id); }
  });
}

function clearAbortHandler(id: string): void {
  _handlers.delete(id);
}

/**
 * Wrap an irreversible async operation with abort + refund handling.
 */
export async function withAbort<T>(
  operationId: string,
  operation: () => Promise<T>,
  refundFn: () => Promise<void>
): Promise<T> {
  // Register abort handler BEFORE running — Apollo-11 law
  registerAbortHandler(operationId, () => {
    console.error(
      `[onyx-vault/abort] ⚠️  Operation ${operationId} aborted — running refund`
    );
    refundFn().catch((e) =>
      console.error(`[onyx-vault/abort] Refund failed for ${operationId}:`, e)
    );
  });

  try {
    const result = await operation();
    clearAbortHandler(operationId);
    return result;
  } catch (err) {
    clearAbortHandler(operationId);
    console.error(
      `[onyx-vault/abort] ❌ Operation ${operationId} failed — running refund`
    );
    try {
      await refundFn();
    } catch (refundErr) {
      console.error(
        `[onyx-vault/abort] Refund error for ${operationId}:`,
        refundErr
      );
    }
    throw err;
  }
}