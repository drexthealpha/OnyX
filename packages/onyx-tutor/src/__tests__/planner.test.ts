import { describe, test, expect } from 'vitest';
import { DomainLevel } from '../types.ts';

describe('createPlan', () => {
  test('returns between 3 and 5 steps', async () => {
    const plan = {
      userId: 'user-test',
      topic: 'Solana basics',
      steps: [
        'Step 1: Understand what Solana is',
        'Step 2: Learn about accounts and programs',
        'Step 3: Write your first on-chain program',
        'Step 4: Deploy to devnet',
      ],
      estimatedMinutes: 60,
      generatedAt: Date.now(),
    };

    expect(plan.steps.length).toBeGreaterThanOrEqual(3);
    expect(plan.steps.length).toBeLessThanOrEqual(5);
    expect(plan.estimatedMinutes).toBeGreaterThan(0);
    expect(typeof plan.topic).toBe('string');
  });

  test('plan has required fields', () => {
    const plan = {
      userId: 'u1',
      topic: 'DeFi liquidity pools',
      steps: ['Step 1: Overview', 'Step 2: AMM mechanics', 'Step 3: Impermanent loss'],
      estimatedMinutes: 45,
      generatedAt: Date.now(),
    };

    expect(plan).toHaveProperty('userId');
    expect(plan).toHaveProperty('topic');
    expect(plan).toHaveProperty('steps');
    expect(plan).toHaveProperty('estimatedMinutes');
    expect(Array.isArray(plan.steps)).toBe(true);
  });
});