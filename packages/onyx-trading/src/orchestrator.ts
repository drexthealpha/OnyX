/**
 * Main orchestrator — runs the full multi-agent trading pipeline
 * Bull + Bear researchers run in parallel (Promise.all)
 * Risk manager adjudicates
 */

import { analyze } from './analysts/market.js';
import { analyzeNews } from './analysts/news.js';
import { analyzeFundamentals } from './analysts/fundamental.js';
import { analyzeSocial } from './analysts/social.js';
import * as bullResearcher from './researchers/bull.js';
import * as bearResearcher from './researchers/bear.js';
import { adjudicate } from './risk/manager.js';
import { getPortfolio, sync } from './portfolio.js';
import { TradeDecision, MarketAnalysis } from './types.js';

export type RiskProfile = 'aggressive' | 'neutral' | 'conservative';

export interface OrchestratorConfig {
  riskProfile: RiskProfile;
  runAllAnalysts: boolean;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  riskProfile: 'neutral',
  runAllAnalysts: true,
};

function kellyMultiplierForProfile(profile: RiskProfile): number {
  switch (profile) {
    case 'aggressive': return 1.0;
    case 'conservative': return 0.25;
    case 'neutral':
    default: return 0.5;
  }
}

export async function runAnalysis(
  token: string,
  config: Partial<OrchestratorConfig> = {},
): Promise<TradeDecision> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Ground the portfolio in reality before analysis
  await sync();

  const marketAnalysis: MarketAnalysis = await analyze(token);

  if (cfg.runAllAnalysts) {
    const [newsAnalysis, fundamentalAnalysis, socialAnalysis] = await Promise.allSettled([
      analyzeNews(token),
      analyzeFundamentals(token),
      analyzeSocial(token),
    ]);

    if (newsAnalysis.status === 'rejected') {
      throw new Error(`Hard Data Requirement Failed: News Analyst Error: ${newsAnalysis.reason}`);
    }
    if (fundamentalAnalysis.status === 'rejected') {
      throw new Error(`Hard Data Requirement Failed: Fundamental Analyst Error: ${fundamentalAnalysis.reason}`);
    }
    if (socialAnalysis.status === 'rejected') {
      throw new Error(`Hard Data Requirement Failed: Social Analyst Error: ${socialAnalysis.reason}`);
    }
  }

  const [bullReport, bearReport] = await Promise.all([
    bullResearcher.research(marketAnalysis),
    bearResearcher.research(marketAnalysis),
  ]);

  const portfolio = getPortfolio();
  const kellyMult = kellyMultiplierForProfile(cfg.riskProfile);
  const riskDecision = adjudicate(bullReport, bearReport, portfolio, kellyMult);

  return {
    token,
    action: riskDecision.action,
    size: riskDecision.size,
    confidence: riskDecision.confidence,
    reasoning: riskDecision.reasoning,
    marketAnalysis,
    bullReport,
    bearReport,
    riskDecision,
    timestamp: Date.now(),
  };
}