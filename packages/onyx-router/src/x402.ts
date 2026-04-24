/**
 * @onyx/router — x402 Micropayment Handler
 *
 * Reads X402_WALLET_KEY from env (user-provided, operator cost: $0).
 * Signs micropayment via @onyx/vault.
 * Validates receipt before forwarding to provider.
 */

import type { PaymentReceipt } from "./types.js";

// Env keys (all user-provided)
const X402_WALLET_KEY = process.env.X402_WALLET_KEY;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const PAYMENT_CHAIN = (process.env.X402_PAYMENT_CHAIN ?? "solana") as "solana" | "base";

// Estimated cost per 1k tokens for x402 pricing header parsing
const USD_PER_REQUEST_OVERHEAD = 0.0001; // x402 protocol fee overhead

/**
 * Parse the x402 payment required header from a 402 response.
 * Header format: X-Payment-Required: price=0.003,currency=USDC,chain=solana,address=<addr>
 */
function parseX402Header(header: string): {
  priceUSD: number;
  chain: "solana" | "base";
  recipientAddress: string;
  currency: string;
} {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k.trim(), v.join("=").trim()];
    }),
  );

  return {
    priceUSD: parseFloat(parts["price"] ?? "0"),
    chain: (parts["chain"] ?? "solana") as "solana" | "base",
    recipientAddress: parts["address"] ?? "",
    currency: parts["currency"] ?? "USDC",
  };
}

/**
 * Sign and submit a USDC micropayment via @onyx/vault.
 * Returns a PaymentReceipt that must be included in the forwarded request.
 *
 * operator cost: $0 — wallet key is user-provided via X402_WALLET_KEY env var.
 */
export async function payForRequest(
  provider: string,
  model: string,
  maxCostUSD: number,
): Promise<PaymentReceipt> {
  if (!X402_WALLET_KEY) {
    throw new Error(
      "X402_WALLET_KEY not set. Set it in your environment to enable paid LLM routing.",
    );
  }

  // Import vault dynamically to avoid hard dep if unused
  let vaultSign: (params: {
    walletKey: string;
    recipientAddress: string;
    amountUSD: number;
    rpcUrl: string;
    chain: "solana" | "base";
  }) => Promise<{ txSignature: string; walletAddress: string }>;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vault = await import("@onyx/vault" as any);
    vaultSign = vault.signPayment ?? vault.default?.signPayment;
    if (typeof vaultSign !== "function") {
      throw new Error("@onyx/vault does not export signPayment");
    }
  } catch (err) {
    throw new Error(
      `Failed to load @onyx/vault for x402 signing: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Derive recipient address from provider registry
  // In production, the provider's 402 response header contains the address.
  // Here we use a placeholder that gets replaced after the actual 402 handshake.
  const recipientAddress = await resolveProviderPaymentAddress(provider);
  const amountUSD = Math.min(maxCostUSD, maxCostUSD + USD_PER_REQUEST_OVERHEAD);

  const result = await vaultSign({
    walletKey: X402_WALLET_KEY,
    recipientAddress,
    amountUSD,
    rpcUrl: SOLANA_RPC_URL,
    chain: PAYMENT_CHAIN,
  });

  const receipt: PaymentReceipt = {
    txSignature: result.txSignature,
    amountUSD,
    provider,
    model,
    timestamp: Date.now(),
    chain: PAYMENT_CHAIN,
    walletAddress: result.walletAddress,
  };

  // Validate receipt before returning
  validateReceipt(receipt, maxCostUSD);

  return receipt;
}

/**
 * Validate that a receipt is well-formed and within budget.
 * Throws if invalid — prevents forwarding bad payments.
 */
export function validateReceipt(receipt: PaymentReceipt, maxCostUSD: number): void {
  if (!receipt.txSignature || receipt.txSignature.length < 10) {
    throw new Error("Invalid payment receipt: missing or malformed txSignature");
  }
  if (receipt.amountUSD <= 0) {
    throw new Error("Invalid payment receipt: amountUSD must be > 0");
  }
  if (receipt.amountUSD > maxCostUSD * 1.05) {
    // Allow 5% overage for fee rounding
    throw new Error(
      `Payment receipt amountUSD ${receipt.amountUSD} exceeds maxCostUSD ${maxCostUSD}`,
    );
  }
  if (!receipt.walletAddress) {
    throw new Error("Invalid payment receipt: missing walletAddress");
  }
  if (Date.now() - receipt.timestamp > 5 * 60 * 1000) {
    throw new Error("Payment receipt is stale (> 5 minutes old)");
  }
}

/**
 * Resolve the payment address for a known provider.
 * In a full production system, this is extracted from the provider's 402 response.
 * For now, we use well-known devnet addresses per provider.
 */
async function resolveProviderPaymentAddress(provider: string): Promise<string> {
  // These are placeholder devnet addresses — in production the real x402 handshake
  // (HTTP 402 → sign → retry) extracts the address from the response header.
  const PROVIDER_PAYMENT_ADDRESSES: Record<string, string> = {
    anthropic: "AnthropicDevnet11111111111111111111111111111",
    openai: "OpenAIDevnet111111111111111111111111111111111",
    google: "GoogleDevnet1111111111111111111111111111111111",
    xai: "XAIDevnet11111111111111111111111111111111111111",
    deepseek: "DeepseekDevnet111111111111111111111111111111111111",
    groq: "GroqDevnet1111111111111111111111111111111111111",
    together: "TogetherDevnet11111111111111111111111111111111",
    cohere: "CohereDevnet11111111111111111111111111111111111",
    moonshot: "MoonshotDevnet1111111111111111111111111111111",
    nvidia: "NvidiaDevnet111111111111111111111111111111111",
    minimax: "MinimaxDevnet11111111111111111111111111111111",
    default: "BlockRunDevnet11111111111111111111111111111111",
  };
  return (
    PROVIDER_PAYMENT_ADDRESSES[provider.toLowerCase()] ??
    PROVIDER_PAYMENT_ADDRESSES["default"]
  );
}

/**
 * Attach a payment receipt to an outgoing request as x402 header.
 * Call this before forwarding the proxied request to the upstream provider.
 */
export function buildX402Headers(receipt: PaymentReceipt): Record<string, string> {
  return {
    "X-Payment": receipt.txSignature,
    "X-Payment-Chain": receipt.chain,
    "X-Payment-Amount": receipt.amountUSD.toFixed(6),
    "X-Payment-Wallet": receipt.walletAddress,
    "X-Payment-Timestamp": receipt.timestamp.toString(),
  };
}