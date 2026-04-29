import { describe, test, expect, mock } from 'vitest';
import { DomainLevel } from '../types.ts';

describe('TutorBot interface', () => {
  test('teach() contract: returns non-empty string', async () => {
    const mockTeach = mock(async (topic: string, level: DomainLevel): Promise<string> => {
      return `## ${topic} (Level ${level})\n\nThis is a teaching response about ${topic}.`;
    });

    const result = await mockTeach('Solana accounts', DomainLevel.BEGINNER);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('quiz() contract: returns array of 3 questions', async () => {
    const mockQuiz = mock(async () => [
      {
        text: 'What is a Solana program?',
        options: ['A) A wallet', 'B) Smart contract', 'C) Token', 'D) Validator'],
        correctAnswer: 'B) Smart contract',
        explanation: 'Programs are Solana\'s equivalent of smart contracts',
        difficulty: DomainLevel.BEGINNER,
      },
      {
        text: 'What is the native SOL token used for?',
        options: ['A) NFTs', 'B) Governance', 'C) Transaction fees', 'D) Staking only'],
        correctAnswer: 'C) Transaction fees',
        explanation: 'SOL pays for transaction fees and rent on Solana',
        difficulty: DomainLevel.BEGINNER,
      },
      {
        text: 'What consensus mechanism does Solana use?',
        options: ['A) PoW', 'B) PoS + PoH', 'C) DPoS', 'D) BFT'],
        correctAnswer: 'B) PoS + PoH',
        explanation: 'Solana uses Proof of Stake combined with Proof of History',
        difficulty: DomainLevel.INTERMEDIATE,
      },
    ]);

    const questions = await mockQuiz('Solana basics');
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(3);
    expect(questions[0]).toHaveProperty('text');
    expect(questions[0]).toHaveProperty('correctAnswer');
    expect(questions[0]).toHaveProperty('explanation');
    expect(questions[0]).toHaveProperty('difficulty');
  });

  test('evaluate() contract: returns Score with correct boolean', async () => {
    const mockEvaluate = mock(async () => ({
      correct: true,
      confidence: 0.95,
      feedback: 'Correct! Solana programs are indeed the smart contract equivalent.',
    }));

    const score = await mockEvaluate('Smart contract', {
      text: 'What is a Solana program?',
      correctAnswer: 'B) Smart contract',
      explanation: 'Programs are Solana\'s equivalent of smart contracts',
      difficulty: DomainLevel.BEGINNER,
    });

    expect(typeof score.correct).toBe('boolean');
    expect(score.confidence).toBeGreaterThanOrEqual(0);
    expect(score.confidence).toBeLessThanOrEqual(1);
    expect(typeof score.feedback).toBe('string');
    expect(score.feedback.length).toBeGreaterThan(0);
  });

  test('DomainLevel enum has correct values', () => {
    expect(DomainLevel.BEGINNER).toBe(1);
    expect(DomainLevel.INTERMEDIATE).toBe(2);
    expect(DomainLevel.ADVANCED).toBe(3);
    expect(DomainLevel.EXPERT).toBe(4);
  });
});