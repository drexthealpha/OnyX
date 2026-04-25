declare module 'axios' {
  interface AxiosRequestConfig {
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
    timeout?: number;
  }
  interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: AxiosRequestConfig;
  }
  interface AxiosInstance {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  }
  function create(config?: unknown): AxiosInstance;
  const axios: AxiosInstance;
  export default axios;
  export { AxiosInstance, AxiosResponse, AxiosRequestConfig };
}

declare module '@anthropic-ai/sdk' {
  interface MessageParam {
    role: 'user' | 'assistant';
    content: string;
  }
  interface ContentBlock {
    type: 'text';
    text: string;
  }
  interface Message {
    id: string;
    type: string;
    role: string;
    content: ContentBlock[];
  }
  interface MessagesOptions {
    model: string;
    max_tokens: number;
    system?: string;
    messages: MessageParam[];
  }
  class Anthropic {
    constructor(config: { apiKey: string });
    messages: {
      create(options: MessagesOptions): Promise<Message>;
    };
  }
  export default Anthropic;
}

declare module '@onyx/intel' {
  export interface TwitterSearchParams {
    query: string;
    maxResults?: number;
  }
  export interface TwitterResult {
    text: string;
    publicMetrics?: { like_count?: number; retweet_count?: number };
  }
  export function searchTwitter(params: TwitterSearchParams): Promise<TwitterResult[]>;
}

declare module '@onyx/privacy' {
  export interface ShieldResult {
    utxoId: string;
    txHash: string;
  }
  export interface SwapResult {
    txHash: string;
    outputUtxoId?: string;
    executionPrice?: number;
    actualSlippageBps?: number;
  }
  export interface UnshieldResult {
    txHash: string;
  }
  export function shield(params: { token: string; amount: number }): Promise<ShieldResult>;
  export function unshield(params: { utxoId: string }): Promise<UnshieldResult>;
  export function privateSwap(params: {
    fromToken: string;
    toToken: string;
    amount: number;
    slippageBps?: number;
    shieldedUtxo?: string;
  }): Promise<SwapResult>;
}

declare module '@onyx/solana' {
  export interface SwapTokensParams {
    fromToken: string;
    toToken: string;
    amountUsd: number;
    slippageBps?: number;
  }
  export interface SwapTokensResult {
    txHash: string;
    executionPrice?: number;
    actualSlippageBps?: number;
  }
  export function swapTokens(params: SwapTokensParams): Promise<SwapTokensResult>;
}

declare module '@onyx/rl' {
  export interface RlOutcome {
    tradeId: string;
    token: string;
    action: string;
    pnlUsd: number;
    pnlPct: number;
    metrics: {
      sharpe30d: number;
      winRate30d: number;
      avgReturn30d: number;
      tradeCount: number;
    };
    timestamp: number;
    source: string;
  }
  export { RlOutcome };
}