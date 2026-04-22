// packages/onyx-compute/src/tests/markets.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectMarket } from '../nosana/markets.js';

// Mock the Nosana client singleton
vi.mock('../nosana/client.js', () => ({
  getNosanaClient: vi.fn(),
}));

import { getNosanaClient } from '../nosana/client.js';

// Sample markets (on-chain format, no avgLatencyMs)
const mockMarkets = [
  {
    address: 'market1111111111111111111111111111111111111111',
    jobPrice: 1000,
    jobExpiration: 3600,
    jobTimeout: 900,
    jobType: 0,
    nodeXnosMinimum: 500_000,
    queueType: 1,    // NODE_QUEUE — nodes ready
    queue: ['node1', 'node2'],
  },
  {
    address: 'market2222222222222222222222222222222222222222',
    jobPrice: 500,   // CHEAPEST
    jobExpiration: 3600,
    jobTimeout: 900,
    jobType: 0,
    nodeXnosMinimum: 100_000,
    queueType: 1,
    queue: ['node3'],
  },
  {
    address: 'market3333333333333333333333333333333333333333',
    jobPrice: 750,
    jobExpiration: 3600,
    jobTimeout: 900,
    jobType: 0,
    nodeXnosMinimum: 1_000_000, // HIGHEST STAKE → FASTEST
    queueType: 1,
    queue: ['node4', 'node5', 'node6'],
  },
];

beforeEach(() => {
  (getNosanaClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    jobs: {
      markets: vi.fn().mockResolvedValue(mockMarkets),
    },
  });
});

describe('selectMarket', () => {
  it('returns the cheapest market when strategy is CHEAPEST', async () => {
    const market = await selectMarket('CHEAPEST');
    expect(market.jobPrice).toBe(500);
    expect(market.address).toBe('market2222222222222222222222222222222222222222');
  });

  it('returns highest-stake market when strategy is FASTEST', async () => {
    const market = await selectMarket('FASTEST');
    expect(market.nodeXnosMinimum).toBe(1_000_000);
    expect(market.address).toBe('market3333333333333333333333333333333333333333');
  });

  it('returns best price/stake ratio when strategy is BALANCED', async () => {
    // Scores: market1=1000/500000=0.002, market2=500/100000=0.005, market3=750/1000000=0.00075
    // Best (lowest ratio) = market3
    const market = await selectMarket('BALANCED');
    expect(market.address).toBe('market3333333333333333333333333333333333333333');
  });

  it('throws when no markets are available', async () => {
    (getNosanaClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      jobs: {
        markets: vi.fn().mockResolvedValue([]),
      },
    });
    await expect(selectMarket('CHEAPEST')).rejects.toThrow('No Nosana markets found');
  });
});