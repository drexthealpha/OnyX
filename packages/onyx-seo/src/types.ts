// ============================================================
// packages/onyx-seo/src/types.ts
// All shared types for @onyx/seo
// ============================================================

export interface SEOAgent {
  name: string;
  systemPrompt: string;
  execute(input: string): Promise<string>;
}

export interface ContentOpportunity {
  keyword: string;
  searchVolume: number;
  competition: number;
  score: number; // searchVolume / (competition * 100)
}

export interface Article {
  title: string;
  metaDescription: string;
  content: string;
  keywords: string[];
  headlineVariants: string[];
}

export interface KeywordMetric {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  trend: string;
}

export interface SERPResult {
  rank: number;
  url: string;
  title: string;
  description: string;
  domain: string;
}

export interface PagePerformance {
  sessions: number;
  bounce: number;
  avgTime: number;
}

export interface PublishResult {
  success: boolean;
  url?: string;
  postId?: number;
  error?: string;
}