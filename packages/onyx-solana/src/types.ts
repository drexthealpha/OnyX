/**
 * @onyx/solana — Core types
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: unknown;
  execute(params: unknown): Promise<unknown>;
}

export interface ToolRegistryEntry {
  name: string;
  description: string;
  inputSchema: unknown;
  execute(params: unknown): Promise<unknown>;
}