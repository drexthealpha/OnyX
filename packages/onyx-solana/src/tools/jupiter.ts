/**
 * @onyx/solana — Jupiter tools
 */

import type { MCPTool } from "../types";

export const swapTokensTool: MCPTool = {
  name: "swapTokens",
  description: "Swap tokens via Jupiter v6 aggregator.",
  inputSchema: {} as any,
  async execute() {
    return { simulated: true, outputAmount: 0 };
  },
};