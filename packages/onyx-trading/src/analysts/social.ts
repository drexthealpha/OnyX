/**
 * Social sentiment analyst — uses @onyx/intel x-twitter source
 * Falls back to neutral if intel package unavailable
 * Operator cost: $0 — user provides TWITTER_BEARER_TOKEN
 */

import { SocialAnalysis } from '../types.js';

async function tryFetchTweets(query: string): Promise<{ text: string; likes: number }[]> {
  try {
    const intel = await import('@onyx/intel');
    const results = await intel.searchTwitter({ query, maxResults: 50 });
    return results.map((r: { text: string; publicMetrics?: { like_count?: number } }) => ({
      text: r.text,
      likes: r.publicMetrics?.like_count ?? 0,
    }));
  } catch {
    return [];
  }
}

function scoreSentiment(tweets: { text: string; likes: number }[]): number {
  if (tweets.length === 0) return 0;

  const bullishWords = ['moon', 'pump', 'buy', 'bullish', 'green', 'up', 'gain', 'rally', 'breakout', 'ath'];
  const bearishWords = ['dump', 'sell', 'bearish', 'red', 'down', 'crash', 'rug', 'scam', 'falling', 'rekt'];

  let totalScore = 0;
  let totalWeight = 0;

  for (const tweet of tweets) {
    const text = tweet.text.toLowerCase();
    let tweetScore = 0;
    bullishWords.forEach(w => { if (text.includes(w)) tweetScore += 1; });
    bearishWords.forEach(w => { if (text.includes(w)) tweetScore -= 1; });

    const weight = 1 + Math.log1p(tweet.likes);
    totalScore += tweetScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.max(-1, Math.min(1, totalScore / totalWeight / 3)) : 0;
}

export async function analyzeSocial(token: string): Promise<SocialAnalysis> {
  const query = `${token} crypto OR solana`;
  const tweets = await tryFetchTweets(query);

  const sentimentScore = scoreSentiment(tweets);
  const mentionCount = tweets.length;
  const trendingScore = Math.min(1, mentionCount / 100);

  let signal: 'BUY' | 'SELL' | 'HOLD';
  let confidence: number;

  if (sentimentScore > 0.3) { signal = 'BUY'; confidence = sentimentScore; }
  else if (sentimentScore < -0.3) { signal = 'SELL'; confidence = Math.abs(sentimentScore); }
  else { signal = 'HOLD'; confidence = 0.3; }

  return {
    token,
    mentionCount,
    sentimentScore,
    trendingScore,
    signal,
    confidence,
    timestamp: Date.now(),
  };
}