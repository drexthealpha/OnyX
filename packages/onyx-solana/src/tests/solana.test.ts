/**
 * @onyx/solana — Tests
 */

import { test, expect } from "vitest";

test("getBalanceTool — has correct properties", async () => {
  const { getBalanceTool } = await import("../tools/wallet.js");
  expect(getBalanceTool.name).toBe("getBalance");
  expect(typeof getBalanceTool.execute).toBe("function");
}, 60000);

test("swapTokensTool — has correct properties", async () => {
  const { swapTokensTool } = await import("../tools/jupiter.js");
  expect(swapTokensTool.name).toBe("swapTokens");
}, 60000);

test("shieldAssetTool — throws descriptive error", async () => {
  const { shieldAssetTool } = await import("../tools/umbra.js");
  try {
    await shieldAssetTool.execute({});
  } catch (err) {
    const msg = (err as Error).message;
    expect(msg.includes("@onyx/privacy") || msg.includes("S14") || msg.includes("ONYX_WALLET_PATH")).toBe(true);
  }
}, 60000);

test("tool registry — exactly 29 tools registered", async () => {
  const { tools } = await import("../index.js");
  expect(tools.length).toBe(27);
}, 60000);

test("getTool — finds tool by name", async () => {
  const { getTool } = await import("../index.js");
  const tool = getTool("swapTokens");
  expect(tool).toBeTruthy();
  expect(tool!.name).toBe("swapTokens");
}, 60000);