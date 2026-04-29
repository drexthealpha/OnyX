---
name: x-api
description: X/Twitter API v2 integration for posting tweets, threads, reading timelines, search, and analytics. Use when the user wants to interact with X programmatically.
origin: ECC
---

# X API

Programmatic interaction with X for posting, reading, searching, and analytics. Used by `@onyx/content` and `@onyx/seo`.

## When to Activate

- Posting tweets or threads programmatically
- Reading timeline, mentions, or user data
- Searching X for content, trends, or conversations
- Building X integrations or bots

## Authentication

```typescript
import { TwitterApi } from 'twitter-api-v2'

const client = new TwitterApi({
  appKey: Bun.env.TWITTER_API_KEY!,
  appSecret: Bun.env.TWITTER_API_SECRET!,
  accessToken: Bun.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: Bun.env.TWITTER_ACCESS_SECRET!,
})

const rwClient = client.readWrite
```

## Post Tweet

```typescript
await rwClient.v2.tweet('ONYX is live. Sovereign AI OS on Solana.')
```

## Post Thread

```typescript
const tweets = ['1/ ONYX architecture:', '2/ L0 kernel enforces Apollo-11 laws', '3/ L4 Financial: vault, trading, privacy, FHE']
let lastId: string | undefined
for (const text of tweets) {
  const res = await rwClient.v2.tweet(text, lastId ? { reply: { in_reply_to_tweet_id: lastId } } : {})
  lastId = res.data.id
}
```

## Rate Limits

- Free tier: 500 tweets/month, 1 read/15min
- Basic: 3,000 tweets/month
- Pro: 300,000 tweets/month

## Env Vars

```
TWITTER_API_KEY, TWITTER_API_SECRET
TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
```