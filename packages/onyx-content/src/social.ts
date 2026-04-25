/**
 * social.ts — Twitter API v2 thread posting via OAuth 1.0a
 * Zero operator cost. All keys are user-provided.
 * Rate limit aware: 50 tweets per 15 minutes.
 */

import crypto from 'crypto';

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const RATE_LIMIT = 50;
const WINDOW_MS = 15 * 60 * 1000;

const rateTracker = { count: 0, windowStart: Date.now() };

function checkRateLimit(): void {
  const now = Date.now();
  if (now - rateTracker.windowStart > WINDOW_MS) {
    rateTracker.count = 0;
    rateTracker.windowStart = now;
  }
  if (rateTracker.count >= RATE_LIMIT) {
    const wait = WINDOW_MS - (now - rateTracker.windowStart);
    throw new Error(`Twitter rate limit reached. Wait ${Math.ceil(wait / 1000)}s`);
  }
  rateTracker.count++;
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildOAuth1Header(
  method: string,
  url: string,
  bodyParams: Record<string, string>,
  credentials: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  },
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };

  const allParams = { ...oauthParams, ...bodyParams };
  const sortedParams = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(credentials.apiSecret)}&${percentEncode(credentials.accessSecret)}`;

  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  oauthParams['oauth_signature'] = signature;

  const headerValue = Object.keys(oauthParams)
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerValue}`;
}

async function postTweet(
  text: string,
  replyToId: string | undefined,
  credentials: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  },
): Promise<string> {
  checkRateLimit();

  const url = `${TWITTER_API_BASE}/tweets`;
  const body: Record<string, unknown> = { text };
  if (replyToId) {
    body.reply = { in_reply_to_tweet_id: replyToId };
  }

  const bodyJson = JSON.stringify(body);
  const authHeader = buildOAuth1Header('POST', url, {}, credentials);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: bodyJson,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { data: { id: string } };
  return data.data.id;
}

export async function postThread(tweets: string[]): Promise<string[]> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error(
      'Twitter credentials not set. Required: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET',
    );
  }

  const credentials = { apiKey, apiSecret, accessToken, accessSecret };
  const tweetIds: string[] = [];
  let replyToId: string | undefined;

  for (const tweetText of tweets) {
    const id = await postTweet(tweetText, replyToId, credentials);
    tweetIds.push(id);
    replyToId = id;
    await new Promise((r) => setTimeout(r, 500));
  }

  return tweetIds;
}