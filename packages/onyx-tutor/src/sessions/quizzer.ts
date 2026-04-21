import { DomainLevel } from '../types.ts';
import type { Question, Score } from '../types.ts';
import { ProfileStore } from '../learner/profile.ts';

const profiles = new ProfileStore();

export async function generateQuiz(
  topic: string,
  level: DomainLevel,
): Promise<Question[]> {
  const { CryptoTutor } = await import('../tutorbots/crypto-tutor.ts');
  const bot = new CryptoTutor();
  const questions = await bot.quiz(topic);

  return questions.filter(
    (q) => Math.abs(q.difficulty - level) <= 1,
  );
}

export interface QuizResult {
  score: number;
  correctCount: number;
  totalCount: number;
  feedback: string[];
}

export async function evaluateAnswers(
  answers: string[],
  questions: Question[],
  userId?: string,
  domain?: string,
): Promise<QuizResult> {
  if (answers.length !== questions.length) {
    throw new Error(`Answer count (${answers.length}) must match question count (${questions.length})`);
  }

  const { CryptoTutor } = await import('../tutorbots/crypto-tutor.ts');
  const bot = new CryptoTutor();

  const scores: Score[] = await Promise.all(
    answers.map((answer, i) => bot.evaluate(answer, questions[i])),
  );

  const correctCount = scores.filter((s) => s.correct).length;
  const score = correctCount / questions.length;

  if (userId && domain) {
    profiles.updateFromQuiz(userId, domain, score);
  }

  return {
    score,
    correctCount,
    totalCount: questions.length,
    feedback: scores.map((s) => s.feedback),
  };
}