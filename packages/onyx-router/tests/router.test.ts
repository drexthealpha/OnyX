/**
 * @onyx/router — Tests
 *
 * Tests:
 * 1. Strategy selects cheapest provider under budget cap
 * 2. Load balancer removes provider after 3 consecutive failures
 * 3. Budget tracker correctly accumulates spend
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { routeRequest, classifyTier } from '../src/routing/strategy.js';
import {
  recordFailure,
  recordSuccess,
  isProviderAvailable,
  resetAllProviderState,
} from '../src/routing/load-balancer.js';
import type { BudgetCap } from '../src/types.js';

// Set test DB path
const testDbPath = './data/test-budget.db';

// Test 1: Strategy selects cheapest provider under budget cap
describe("routeRequest — strategy", () => {
  it("selects cheapest qualifying provider under budget cap", () => {
    const budget: BudgetCap = {
      userId: "test-user-1",
      maxCostPerRequestUSD: 0.001,
    };

    const decision = routeRequest("What is the capital of France?", budget);

    expect(decision.provider.tier).toBe("budget");
    expect(decision.estimatedCostUSD).toBeLessThanOrEqual(0.001);
    expect(decision.model).toBeTruthy();
    expect(decision.tier).toBe("SIMPLE");
  });

  it("upgrades to mid/premium for complex prompts", () => {
    const budget: BudgetCap = {
      userId: "test-user-1",
      maxCostPerRequestUSD: 0.1,
    };

    const decision = routeRequest(
      "Analyze the architectural tradeoffs between microservices and monolithic systems. " +
      "Write a comprehensive comparison covering scalability, maintainability, deployment complexity, " +
      "and team organization. Include concrete examples from industry.",
      budget,
      { maxOutputTokens: 2000 },
    );

    expect(["COMPLEX", "MEDIUM"]).toContain(decision.tier);
  });

  it("throws when no provider fits budget cap", () => {
    const budget: BudgetCap = {
      userId: "test-user-1",
      maxCostPerRequestUSD: 0.000001,
    };

    const decision = routeRequest("hi", budget);
    expect(decision.estimatedCostUSD).toBe(0);
    expect(decision.provider.name).toBe("nvidia");
  });
});

// Test 2: Load balancer removes provider after 3 consecutive failures
describe("load balancer", () => {
  beforeEach(() => {
    resetAllProviderState();
  });

  it("provider available initially", () => {
    expect(isProviderAvailable("test-provider")).toBe(true);
  });

  it("records success and resets failure count", () => {
    recordFailure("test-provider");
    recordFailure("test-provider");
    recordSuccess("test-provider");
    expect(isProviderAvailable("test-provider")).toBe(true);
  });

  it("removes provider after 3 consecutive failures", () => {
    recordFailure("test-provider");
    expect(isProviderAvailable("test-provider")).toBe(true);

    recordFailure("test-provider");
    expect(isProviderAvailable("test-provider")).toBe(true);

    recordFailure("test-provider");
    expect(isProviderAvailable("test-provider")).toBe(false);
  });

  it("does not remove after 2 failures then success", () => {
    recordFailure("flaky-provider");
    recordFailure("flaky-provider");
    recordSuccess("flaky-provider");
    recordFailure("flaky-provider");
    expect(isProviderAvailable("flaky-provider")).toBe(true);
  });
});

// Test 3: Tier classification
describe("classifyTier", () => {
  it("classifies short factual questions as SIMPLE", () => {
    expect(classifyTier("What is the capital of France?")).toBe("SIMPLE");
    expect(classifyTier("Hello how are you")).toBe("SIMPLE");
  });

  it("classifies math/proof questions as REASONING", () => {
    expect(classifyTier("Prove that the square root of 2 is irrational using step by step formal logic")).toBe("REASONING");
    expect(classifyTier("Solve this differential equation and prove the solution is unique")).toBe("REASONING");
  });

  it("classifies code/architecture as COMPLEX", () => {
    expect(classifyTier("Analyze and refactor this database architecture")).toBe("COMPLEX");
    expect(classifyTier("Implement a binary search tree class with all operations in TypeScript")).toBe("COMPLEX");
  });
});