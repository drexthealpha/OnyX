/**
 * Social sentiment analyst — uses @onyx/intel x-twitter source
 * Grounded in real-time intelligence and engagement-weighted scoring.
 */

import { SocialAnalysis } from '../types.js';

async function tryFetchTweets(query: string): Promise<{ text: string; likes: number }[]> {
  try {
    const intel = await import('@onyx/intel');
    const sources = await intel.runAllSources(query);
    
    // Filter for social sources (e.g. x-twitter, reddit)
    const socialSources = sources.filter(s => 
      s.platform === 'x-twitter' || 
      s.platform === 'reddit' || 
      s.platform.includes('social')
    );
    
    return socialSources.map(s => ({
      text: s.title + ' ' + (s.snippet || ''),
      likes: s.engagement ?? Math.round((s.score || 0) * 100),
    }));
  } catch (err) {
    throw new Error(`[social-analyst] Failed to fetch intel: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * LLM-based sentiment scoring via @onyx/router
 */
async function scoreSentiment(tweets: { text: string; likes: number }[]): Promise<number> {
  if (tweets.length === 0) return 0;

  const intelData = tweets.map((t, i) => `[Tweet ${i+1} (Engagement: ${t.likes})]: ${t.text}`).join('\n\n');

  try {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 20,
        system: `You are a crypto social sentiment analyst. 
Analyze the provided tweets and return a sentiment score between -1 (extremely bearish) and 1 (extremely bullish).
Weight high-engagement tweets more heavily.
Return ONLY a single number.`,
        messages: [{ role: 'user', content: `TWEETS:\n${intelData}` }]
      })
    });
    const data = (await res.json()) as any;
    const result = data.content?.[0]?.text ?? '0';

    const score = parseFloat(result);
    return isNaN(score) ? 0 : Math.max(-1, Math.min(1, score));
  } catch (err) {
    throw new Error(`[social-analyst] LLM scoring failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function analyzeSocial(token: string): Promise<SocialAnalysis> {
  const query = `${token} crypto sentiment OR solana ${token}`;
  const tweets = await tryFetchTweets(query);

  const sentimentScore = await scoreSentiment(tweets);
  const mentionCount = tweets.length;
  
  // Trending score based on volume (normalized to 100 mentions)
  const trendingScore = Math.min(1, mentionCount / 100);

  let signal: 'BUY' | 'SELL' | 'HOLD';
  let confidence: number;

  if (sentimentScore > 0.25) { 
    signal = 'BUY'; 
    confidence = Math.min(1, sentimentScore * 1.5); 
  } else if (sentimentScore < -0.25) { 
    signal = 'SELL'; 
    confidence = Math.min(1, Math.abs(sentimentScore) * 1.5); 
  } else { 
    signal = 'HOLD'; 
    confidence = 0.5; 
  }

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