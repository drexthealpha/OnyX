import { describe, test, expect } from 'vitest';
import type { LearnerProfile, Question, Score, StudyPlan } from '../src/types.ts';
import { DomainLevel } from '../src/types.ts';

describe('onyx-tutor types and exports', () => {
  test('LearnerProfile has required fields', () => {
    const profile: LearnerProfile = {
      userId: 'test-user',
      domains: {},
      style: 'verbal',
      goals: [],
      preferences: {},
    };
    expect(profile).toHaveProperty('userId');
    expect(profile).toHaveProperty('domains');
    expect(profile).toHaveProperty('style');
    expect(profile).toHaveProperty('goals');
    expect(profile).toHaveProperty('preferences');
  });

  test('Question has required fields', () => {
    const q: Question = {
      text: 'What is Solana?',
      correctAnswer: 'A) option',
      explanation: 'It is a blockchain',
      difficulty: DomainLevel.BEGINNER,
      options: ['A) option', 'B) option', 'C) option', 'D) option'],
    };
    expect(q).toHaveProperty('text');
    expect(q).toHaveProperty('correctAnswer');
    expect(q).toHaveProperty('explanation');
    expect(q).toHaveProperty('difficulty');
  });

  test('Score has correct confidence range', () => {
    const s: Score = {
      correct: true,
      confidence: 0.95,
      feedback: 'Good answer',
    };
    expect(s.confidence).toBeGreaterThanOrEqual(0);
    expect(s.confidence).toBeLessThanOrEqual(1);
  });

  test('StudyPlan has required fields', () => {
    const plan: StudyPlan = {
      userId: 'u1',
      topic: 'Solana',
      steps: ['Step 1', 'Step 2', 'Step 3'],
      estimatedMinutes: 30,
      generatedAt: Date.now(),
    };
    expect(plan).toHaveProperty('userId');
    expect(plan).toHaveProperty('topic');
    expect(plan).toHaveProperty('steps');
    expect(plan).toHaveProperty('estimatedMinutes');
  });
});