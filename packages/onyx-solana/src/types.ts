/**
 * @onyx/solana — Core types
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  execute(params: any): Promise<any>;
}

export interface ToolRegistryEntry {
  name: string;
  description: string;
  inputSchema: any;
  execute(params: any): Promise<unknown>;
}