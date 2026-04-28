/**
 * herald.test.ts
 * Test: Herald delivers published messages to all subscribers but not
 *       to unsubscribed handlers.
 */
import { describe, expect, it, vi } from "vitest";
import { createHerald } from "./herald.js";

describe("Herald", () => {
  it("delivers a published message to all active subscribers", () => {
    const herald = createHerald("test");
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    herald.subscribe("topic.foo", handlerA);
    herald.subscribe("topic.foo", handlerB);

    herald.publish("topic.foo", { x: 42 });

    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerA).toHaveBeenCalledWith({ x: 42 });
    expect(handlerB).toHaveBeenCalledOnce();
    expect(handlerB).toHaveBeenCalledWith({ x: 42 });
  });

  it("does NOT deliver to unsubscribed handlers", () => {
    const herald = createHerald("test");
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    const unsubA = herald.subscribe("topic.bar", handlerA);
    herald.subscribe("topic.bar", handlerB);

    unsubA();

    herald.publish("topic.bar", "hello");

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledOnce();
    expect(handlerB).toHaveBeenCalledWith("hello");
  });

  it("does not deliver to subscribers of a different topic", () => {
    const herald = createHerald("test");
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    herald.subscribe("topic.a", handlerA);
    herald.subscribe("topic.b", handlerB);

    herald.publish("topic.a", 1);

    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).not.toHaveBeenCalled();
  });

  it("calling unsubscribe twice is idempotent", () => {
    const herald = createHerald("test");
    const handler = vi.fn();
    const unsub = herald.subscribe("topic.x", handler);

    unsub();
    unsub();

    herald.publish("topic.x", 99);
    expect(handler).not.toHaveBeenCalled();
  });

  it("continues delivering to remaining handlers when one throws", () => {
    const herald = createHerald("test");
    const errorHandler = vi.fn(() => {
      throw new Error("handler blew up");
    });
    const safeHandler = vi.fn();

    herald.subscribe("crash.topic", errorHandler);
    herald.subscribe("crash.topic", safeHandler);

    expect(() => herald.publish("crash.topic", "data")).not.toThrow();
    expect(safeHandler).toHaveBeenCalledOnce();
  });

  it("reports correct subscriber counts", () => {
    const herald = createHerald("test");
    expect(herald.subscriberCount("x")).toBe(0);

    const unsub = herald.subscribe("x", vi.fn());
    herald.subscribe("x", vi.fn());
    expect(herald.subscriberCount("x")).toBe(2);

    unsub();
    expect(herald.subscriberCount("x")).toBe(1);
  });
});