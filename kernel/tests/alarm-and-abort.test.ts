/**
 * kernel/tests/alarm-and-abort.test.ts
 * Tests for kernel/alarm-and-abort.ts (financial abort system).
 */

import { describe, test, expect } from "vitest";
import { register, abort, clear } from "../alarm-and-abort.ts";
import { AlarmCode } from "../types.ts";

describe("Alarm and Abort (financial abort system)", () => {

  test("abort() calls refund exactly once", async () => {
    let refundCallCount = 0;

    register("op-refund-once", {
      code:   AlarmCode.BUDGET_CAP,
      refund: async () => { refundCallCount++; },
    });

    await abort("op-refund-once", AlarmCode.BUDGET_CAP);

    expect(refundCallCount).toBe(1);
  });

  test("aborting unknown operationId throws", async () => {
    const unknownId = "op-does-not-exist-" + Date.now();

    await expect(
      abort(unknownId, AlarmCode.TIMEOUT)
    ).rejects.toThrow();
  });

  test("clear() prevents subsequent abort from calling refund", async () => {
    let refundCalled = false;

    register("op-clear-test", {
      code:   AlarmCode.SLIPPAGE,
      refund: async () => { refundCalled = true; },
    });

    clear("op-clear-test");

    await expect(
      abort("op-clear-test", AlarmCode.SLIPPAGE)
    ).rejects.toThrow();

    expect(refundCalled).toBe(false);
  });

});