// Stubs for upstream @onyx/* packages - provides type declarations only for SDK compilation
// These are NOT implementations - they're type stubs to allow SDK to compile

export interface OnyxRuntime {
  _type: 'OnyxRuntime';
}

// @onyx/research types
export interface ResearchState {
  topic: string;
  subQuestions: string[];
  retrievedContent: RetrievedItem[];
  synthesis: string;
  citations: Citation[];
  report: string;
  complete: boolean;
  reflectionPassed?: boolean;
  qualityScore?: number;
  errors?: string[];
}

export interface RetrievedItem {
  url: string;
  title: string;
  content: string;
  source: 'web' | 'intel' | 'semantic';
  retrievedAt: string;
  urlHash: string;
}

export interface Citation {
  id: string;
  url: string;
  title: string;
  excerpt: string;
}

export interface ScheduledJob {
  id: string;
  topic: string;
  deliverAt: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  createdAt: string;
  result?: string;
  error?: string;
}

export interface ResearchSignal {
  topic: string;
  signal: 'bullish' | 'bearish' | 'neutral' | 'unknown';
  confidence: number;
  keyEntities: string[];
  summary: string;
  extractedAt: string;
}

// @onyx/intel types
export interface IntelBrief {
  topic: string;
  brief: string;
  sources: IntelSource[];
  timestamp: number;
  confidence: number;
}

export interface IntelSource {
  platform: string;
  title: string;
  url: string;
  score: number;
  snippet: string;
  engagement?: number;
  publishedAt?: number;
}

// @onyx/trading types
export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketAnalysis {
  ticker: string;
  ohlcv: OHLCV[];
  signals: string[];
  sentiment: string;
  updatedAt: number;
}

export interface NewsAnalysis {
  ticker: string;
  stories: string[];
  sentiment: number;
}

export interface FundamentalAnalysis {
  ticker: string;
  metrics: Record<string, number>;
}

export interface SocialAnalysis {
  ticker: string;
  mentions: number;
  sentiment: number;
}

export interface ResearchReport {
  ticker: string;
  summary: string;
  sources: string[];
}

export interface RiskDecision {
  action: 'trade' | 'wait' | 'abort';
  reason: string;
}

export interface TradeDecision {
  token: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  size: number;
  reasoning: string;
  kellyFraction: number;
  timestamp: number;
}

export interface Portfolio {
  positions: Position[];
  totalValue: number;
}

export interface Position {
  token: string;
  amount: number;
  value: number;
  pnl: number;
}

export interface ExecutionResult {
  success: boolean;
  txId?: string;
  error?: string;
}

export interface CompletedTrade {
  token: string;
  action: 'BUY' | 'SELL';
  amount: number;
  price: number;
  timestamp: number;
  txId: string;
}

export interface TradeSignal {
  token: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
}

export interface BacktestResult {
  trades: CompletedTrade[];
  pnl: number;
  sharpe: number;
  drawdown: number;
}

export interface RiskProfile {
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
}

export interface OrchestratorConfig {
  riskProfile: 'aggressive' | 'neutral' | 'conservative';
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
}

// @onyx/privacy types
export type U64 = bigint;
export type U128 = bigint;
export type U256 = bigint;
export type Address = string;

export interface DepositResult {
  success: boolean;
  txId?: string;
  amounts?: string[];
}

export interface WithdrawResult {
  success: boolean;
  txId?: string;
}

export interface ClaimResult {
  success: boolean;
  requestId?: string;
  status?: string;
  elapsedMs?: number;
}

export interface UTXOScanResult {
  utxos: UTXO[];
}

export interface UTXO {
  amount: bigint;
  destinationAddress: string;
  payload: string;
  leafIndex: number;
}

export interface OnyxUmbraConfig {
  signer: unknown;
  network: string;
  relayerUrl?: string;
}

// @onyx/compute types
export interface ComputeBackend {
  name: string;
  status: string;
}

export interface MarketStrategy {
  name: string;
  criteria: string[];
}

// @onyx/tutor types
export interface DomainRecord {
  level: number;
  xp: number;
  topics: Record<string, number>;
}

export interface LearnerProfile {
  id: string;
  name: string;
  style: LearningStyle;
  domains: Record<string, DomainRecord>;
}

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Score {
  value: number;
  breakdown: Record<string, number>;
}

export interface TutorBot {
  name: string;
  teach(topic: string, level: number): Promise<string>;
  quiz(topic: string): Promise<Question[]>;
  evaluate(answer: string, question: string): Promise<Score>;
}

export interface StudyPlan {
  id: string;
  topic: string;
  steps: StudyStep[];
}

export interface StudyStep {
  title: string;
  content: string;
}

export interface ProgressRecord {
  userId: string;
  topic: string;
  completed: string[];
  scores: number[];
}

export interface TeachRequest {
  userId: string;
  domain: string;
  topic: string;
}

export interface QuizRequest {
  userId: string;
  domain: string;
  topic: string;
}

export interface EvaluateRequest {
  userId: string;
  question: string;
  answer: string;
}

export interface PlanRequest {
  userId: string;
  topic: string;
}

// Create runtime stub
export function createOnyxRuntime(config: { gatewayUrl: string }): OnyxRuntime {
  return { _type: 'OnyxRuntime' };
}

// ResearchGraph stub
export class ResearchGraph {
  run(topic: string): Promise<ResearchState> {
    return Promise.resolve({
      topic,
      subQuestions: [],
      retrievedContent: [],
      synthesis: '',
      citations: [],
      report: '',
      complete: true,
    });
  }
}

// runResearch function
export function runResearch(graph: ResearchGraph, topic: string): Promise<ResearchState> {
  return graph.run(topic);
}

// runIntel function  
export function runIntel(topic: string): Promise<IntelBrief> {
  return Promise.resolve({
    topic,
    brief: '',
    sources: [],
    timestamp: Date.now(),
    confidence: 0,
  });
}

// runAnalysis function
export function runAnalysis(token: string, config?: Partial<OrchestratorConfig>): Promise<TradeDecision> {
  return Promise.resolve({
    token,
    action: 'HOLD',
    confidence: 0,
    size: 0,
    reasoning: '',
    kellyFraction: 0,
    timestamp: Date.now(),
  });
}

// getCompute function
export function getCompute(): Promise<string> {
  return Promise.resolve('local-ollama');
}

// createUmbraClient function
export function createUmbraClient(config: OnyxUmbraConfig): Promise<unknown> {
  return Promise.resolve({});
}