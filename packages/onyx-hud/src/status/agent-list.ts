// ─────────────────────────────────────────────
//  @onyx/hud — status/agent-list.ts
//  getActiveAgents(): calls @onyx/multica council.list()
//  Falls back to HTTP if multica unavailable.
// ─────────────────────────────────────────────

const GATEWAY_PORT = process.env["GATEWAY_PORT"] ?? "3000";

/**
 * Returns active agent identifiers, e.g. ["explorer:haiku", "coder:sonnet"]
 */
export async function getActiveAgents(): Promise<string[]> {
  // Attempt 1: @onyx/multica council.list()
  try {
    const multica = await import("@onyx/multica").catch(() => null);
    if (multica?.globalCouncil) {
      return (multica.globalCouncil as any).listMembers().map((m: any) => m.agentId);
    }
  } catch (err) {
    console.warn("[onyx-hud/agent-list] council.list() failed:", err);
  }

  // Attempt 2: gateway HTTP
  try {
    const res = await fetch(`http://localhost:${GATEWAY_PORT}/agents`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    const data = await res.json() as unknown;
    if (Array.isArray(data)) return data.map(String);
    if (data && typeof data === "object") {
      const agents = (data as Record<string, unknown>)["agents"];
      if (Array.isArray(agents)) return agents.map(String);
    }
  } catch { /* gateway not running */ }

  return [];
}

/** "◐ explore [haiku]  ◐ code [sonnet]" */
export function formatAgentLine(agents: string[]): string {
  if (agents.length === 0) return "";
  return agents.map((a) => {
    const [role, model] = a.split(":");
    return model ? `◐ ${role} [${model}]` : `◐ ${role}`;
  }).join("  ");
}