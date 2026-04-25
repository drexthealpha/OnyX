import { test, expect, mock, beforeEach } from 'bun:test';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = originalFetch;
});

test('Pipeline passes step 1 output as input to step 2', async () => {
  const { Pipeline } = await import('../pipeline.js');
  const log: unknown[] = [];

  const result = await new Pipeline()
    .step('step-a', async (_input) => {
      return { value: 42 };
    })
    .step('step-b', async (input) => {
      log.push(input);
      return { doubled: (input as { value: number }).value * 2 };
    })
    .run('initial');

  expect(result.success).toBe(true);
  expect(log[0]).toEqual({ value: 42 });
  expect((result.output as { doubled: number }).doubled).toBe(84);
  expect(result.steps).toHaveLength(2);
  expect(result.steps[0]!.name).toBe('step-a');
  expect(result.steps[1]!.name).toBe('step-b');
});

test('Executor retries exactly 3 times then calls abort', async () => {
  const { Pipeline } = await import('../pipeline.js');

  const abortCalls: unknown[] = [];
  globalThis.fetch = async (url: string | URL) => {
    const u = String(url);
    if (u.includes('alarm-and-abort')) {
      abortCalls.push(true);
    }
    return new Response('{}', { status: 200 });
  };

  let attempts = 0;
  let threw = false;

  try {
    await new Pipeline()
      .step('always-fails', async (_input) => {
        attempts++;
        throw new Error('transient failure');
      })
      .run('test');
  } catch {
    threw = true;
  }

  expect(threw).toBe(true);
  expect(attempts).toBe(3);
  expect(abortCalls.length).toBeGreaterThanOrEqual(1);
});

test('Private payroll runs for single employee with mocked privacy', async () => {
  mock.module('@onyx/privacy', () => ({
    shieldAsset: async () => ({ signature: 'mock-sig-123' }),
  }));

  mock.module('@onyx/mem', () => ({
    store: async () => {},
    retrieve: async () => null,
  }));

  const { runPayroll } = await import('../workflows/private-payroll.js');

  let threw = false;
  try {
    await runPayroll([{ address: 'TestWallet123', amountUsdc: 500 }]);
  } catch (e) {
    threw = true;
  }

  expect(threw).toBe(false);
});