// ─────────────────────────────────────────────
//  @onyx/hud — status/tool-display.ts
//  Tracks currently-running tool names.
//  toolStarted / toolEnded called via IPC from renderer when
//  gateway emits tool_start / tool_end events on multica herald.
// ─────────────────────────────────────────────

export interface ActiveTool {
  name: string;
  startedAt: string;
  elapsedMs: number;
}

const activeTools = new Map<string, { name: string; startedAt: Date }>();

export function toolStarted(toolId: string, toolName: string): void {
  activeTools.set(toolId, { name: toolName, startedAt: new Date() });
}

export function toolEnded(toolId: string): void {
  activeTools.delete(toolId);
}

export function getActiveTools(): ActiveTool[] {
  const now = Date.now();
  return Array.from(activeTools.values()).map(({ name, startedAt }) => ({
    name,
    startedAt: startedAt.toISOString(),
    elapsedMs: now - startedAt.getTime(),
  }));
}

/** "◐ web_search (1.2s)  ◐ bash (0.4s)" */
export function formatToolLine(tools: ActiveTool[]): string {
  if (tools.length === 0) return "";
  return tools
    .map((t) => `◐ ${t.name} (${(t.elapsedMs / 1000).toFixed(1)}s)`)
    .join("  ");
}

export function clearActiveTools(): void {
  activeTools.clear();
}