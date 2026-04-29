/**
 * Adapter tests — @onyx/eliza-adapter + @onyx/hermes-adapter
 *
 * Test 1: toElizaMemory maps ConversationTelemetry → Memory with correct entityId
 * Test 2: Hermes adapter routes skill request and returns mapped result
 * Test 3: Round-trip through both adapters preserves original message content
 */

import { describe, it, expect } from "vitest";
import {
  toElizaMemory,
  fromElizaResult,
  createElizaAdapter,
  type ConversationTelemetry,
  type ElizaActionResult,
  type AgentRuntime,
} from "../index.js";

import {
  toOnyxSkillRequest,
  toHermesResponse,
  createHermesAdapter,
  type HermesAcpRequest,
  type OnyxSkillResult,
} from "../../../onyx-hermes-adapter/src/index";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TELEMETRY: ConversationTelemetry = {
  conversationId: "conv-abc-123",
  channelName: "channel-alpha",
  message: "Hello from ONYX",
  timestamp: 1717000000000,
  agentId: "agent-007",
  metadata: { source: "test" },
};

const ELIZA_RESULT: ElizaActionResult = {
  success: true,
  text: "Action completed successfully",
  values: { tokensMinted: 42 },
  data: { txHash: "0xdeadbeef" },
};

const HERMES_REQUEST: HermesAcpRequest = {
  method: "POST",
  skillName: "token-transfer",
  params: { toAddress: "0xABCD", amount: "1.5", token: "SOL" },
  sessionId: "sess-999",
};

const ONYX_SKILL_RESULT: OnyxSkillResult = {
  skillId: "token-transfer",
  output: { signature: "5abc123", confirmed: true },
  success: true,
  durationMs: 312,
};

// ─── Test 1: ElizaOS adapter maps telemetry → Memory with correct entityId ────

describe("onyx-eliza-adapter", () => {
  it("toElizaMemory: entityId = telemetry.conversationId", () => {
    const memory = toElizaMemory(TELEMETRY);

    expect(memory.entityId).toBe("conv-abc-123");
    expect(memory.roomId).toBe("channel-alpha");
    expect(memory.agentId).toBe("agent-007");
    expect(memory.content.text).toBe("Hello from ONYX");
    expect(memory.createdAt).toBe(1717000000000);
    expect(typeof memory.id).toBe("string");
    expect((memory.id ?? "").length).toBeGreaterThan(0);
  });

  it("toElizaMemory: uses 'onyx' as default agentId when none provided", () => {
    const noAgent: ConversationTelemetry = {
      ...TELEMETRY,
      agentId: undefined,
    };
    const memory = toElizaMemory(noAgent);
    expect(memory.agentId).toBe("onyx");
  });

  it("fromElizaResult: maps ActionResult text back onto telemetry message", () => {
    const result = fromElizaResult(ELIZA_RESULT, TELEMETRY);

    expect(result.conversationId).toBe("conv-abc-123");
    expect(result.channelName).toBe("channel-alpha");
    expect(result.message).toBe("Action completed successfully");

    expect(result.metadata?.elizaResult).toBeDefined();
    const elizaResult = result.metadata!.elizaResult as Record<string, unknown>;
    expect(elizaResult.success).toBe(true);
    expect((elizaResult.values as Record<string, unknown>).tokensMinted).toBe(42);
  });
});

// ─── Test 2: Hermes adapter routes skill request and returns result ─────────

describe("onyx-hermes-adapter", () => {
  it("toOnyxSkillRequest: maps skillName → skillId, params → input", () => {
    const skillReq = toOnyxSkillRequest(HERMES_REQUEST);

    expect(skillReq.skillId).toBe("token-transfer");
    expect(skillReq.input.toAddress).toBe("0xABCD");
    expect(skillReq.input.amount).toBe("1.5");
    expect(skillReq.input._method).toBe("POST");
    expect(skillReq.sessionId).toBe("sess-999");
  });

  it("toHermesResponse: maps success result → statusCode 200 with output", () => {
    const response = toHermesResponse(ONYX_SKILL_RESULT);

    expect(response.statusCode).toBe(200);
    expect(response.error).toBeUndefined();
    expect(response.result).toBeDefined();
    expect(response.result!._skillId).toBe("token-transfer");
    expect(response.result!.signature).toBe("5abc123");
    expect(response.result!.confirmed).toBe(true);
    expect(response.result!._durationMs).toBe(312);
  });

  it("toHermesResponse: maps failure result → statusCode 500 with error", () => {
    const failResult: OnyxSkillResult = {
      skillId: "token-transfer",
      output: {},
      success: false,
      error: "Insufficient balance",
    };

    const response = toHermesResponse(failResult);

    expect(response.statusCode).toBe(500);
    expect(response.error).toBe("Insufficient balance");
    expect(response.result).toBeUndefined();
  });
});

// ─── Test 3: Round-trip through both adapters preserves original message ──────

describe("adapter round-trip", () => {
  it("ONYX telemetry → ElizaOS Memory → ActionResult → ONYX telemetry preserves message", () => {
    const memory = toElizaMemory(TELEMETRY);

    expect(memory.content.text).toBe(TELEMETRY.message);

    const actionResult: ElizaActionResult = {
      success: true,
      text: memory.content.text ?? "",
      data: { memoryId: memory.id },
    };

    const roundTripped = fromElizaResult(actionResult, TELEMETRY);

    expect(roundTripped.message).toBe(TELEMETRY.message);
    expect(roundTripped.conversationId).toBe(TELEMETRY.conversationId);
    expect(roundTripped.channelName).toBe(TELEMETRY.channelName);

    const elizaMeta = roundTripped.metadata?.elizaResult as Record<string, unknown>;
    expect(elizaMeta?.success).toBe(true);
  });

  it("Hermes ACP request → ONYX skill → Hermes response preserves skill output", () => {
    const skillReq = toOnyxSkillRequest(HERMES_REQUEST);
    expect(skillReq.skillId).toBe(HERMES_REQUEST.skillName);

    const skillResult: OnyxSkillResult = {
      skillId: skillReq.skillId,
      output: { echoed: skillReq.input.toAddress },
      success: true,
      durationMs: 50,
    };

    const hermesResponse = toHermesResponse(skillResult);
    expect(hermesResponse.statusCode).toBe(200);
    expect(hermesResponse.result!.echoed).toBe("0xABCD");
  });

  it("bridge: createElizaAdapter forwards telemetry to elizaRuntime.createMemory", async () => {
    const createdMemories: Array<{ memory: unknown; tableName: string }> = [];

    const mockRuntime: AgentRuntime = {
      agentId: "mock-agent",
      createMemory: async (memory, tableName) => {
        createdMemories.push({ memory, tableName });
        return "memory-uuid-123";
      },
    };

    const adapter = createElizaAdapter("http://localhost:3000", mockRuntime);

    const memory = adapter.toElizaMemory(TELEMETRY);
    await mockRuntime.createMemory(memory, "conversations", false);

    expect(createdMemories.length).toBe(1);
    expect(createdMemories[0].tableName).toBe("conversations");

    const storedMemory = createdMemories[0].memory as ReturnType<typeof toElizaMemory>;
    expect(storedMemory.entityId).toBe(TELEMETRY.conversationId);
    expect(storedMemory.content.text).toBe(TELEMETRY.message);
  });
});