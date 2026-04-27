/**
 * @onyx/solana — wallet tools (standalone implementation)
 */

export const getBalanceTool = {
  name: "getBalance",
  description: "Get SOL balance for the ONYX wallet or any public address",
  inputSchema: {},
  execute(params: { wallet?: string }) {
    const address = params.wallet ?? "mock_address";
    return { address, lamports: 1000000000, sol: 1 };
  },
};

export const transferTool = {
  name: "transfer",
  description: "Transfer SOL from the ONYX agent wallet to a recipient.",
  inputSchema: {},
  execute(params: { to: string; lamports: number }) {
    return { signature: "mock_sig", from: "mock", to: params.to, lamports: params.lamports };
  },
};