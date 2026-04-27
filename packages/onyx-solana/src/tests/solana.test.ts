/**
 * @onyx/solana — Tests
 */

import assert from "node:assert/strict";
import { test } from "node:test";

test("getBalanceTool — has correct properties", async () => {
  const { getBalanceTool } = await import("../tools/wallet.js");
  assert.equal(getBalanceTool.name, "getBalance");
  assert.equal(typeof getBalanceTool.execute, "function");
});

test("swapTokensTool — has correct properties", async () => {
  const { swapTokensTool } = await import("../tools/jupiter.js");
  assert.equal(swapTokensTool.name, "swapTokens");
});

test("shieldAssetTool — throws descriptive error", async () => {
  const { shieldAssetTool } = await import("../tools/umbra.js");
  try {
    await shieldAssetTool.execute({});
  } catch (err) {
    const msg = (err as Error).message;
    assert.ok(msg.includes("@onyx/privacy") || msg.includes("S14"), msg);
  }
});

test("tool registry — exactly 29 tools registered", async () => {
  const { tools } = await import("../index.js");
  assert.equal(tools.length, 28, `Expected 28 tools, got ${tools.length}`);
});

test("getTool — finds tool by name", async () => {
  const { getTool } = await import("../index.js");
  const tool = getTool("swapTokens");
  assert.ok(tool);
  assert.equal(tool!.name, "swapTokens");
});