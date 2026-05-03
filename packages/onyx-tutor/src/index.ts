import { Hono } from 'hono';
import { ProfileStore } from './learner/profile.js';
import { detectStyle } from './learner/style.js';
import { GoalTracker } from './learner/goals.js';
import { createPlan } from './sessions/planner.js';
import { generateQuiz, evaluateAnswers } from './sessions/quizzer.js';
import { ProgressTracker } from './sessions/progress.js';
import { CryptoTutor } from './tutorbots/crypto-tutor.js';
import { CodeTutor } from './tutorbots/code-tutor.js';
import { ResearchTutor } from './tutorbots/research-tutor.js';
import { FinanceTutor } from './tutorbots/finance-tutor.js';
import type {
  TeachRequest,
  QuizRequest,
  EvaluateRequest,
  PlanRequest,
  UpdateScoreRequest,
  SetGoalRequest,
  TutorBot,
} from './types.js';

export * from './types.js';
export * from './learner/profile.js';
export * from './learner/style.js';
export * from './learner/goals.js';
export * from './learner/preferences.js';
export * from './sessions/planner.js';
export * from './sessions/quizzer.js';
export * from './sessions/progress.js';
export * from './tutorbots/crypto-tutor.js';
export * from './tutorbots/code-tutor.js';
export * from './tutorbots/research-tutor.js';
export * from './tutorbots/finance-tutor.js';

const TUTORBOTS: Record<string, TutorBot> = {
  crypto:   new CryptoTutor(),
  code:     new CodeTutor(),
  research: new ResearchTutor(),
  finance:  new FinanceTutor(),
};

const app = new Hono();
const profiles = new ProfileStore();
const goals = new GoalTracker();
const progress = new ProgressTracker();

app.get('/health', (c) => c.json({ status: 'ok', service: '@onyx/tutor' }));

app.get('/profile/:userId', (c) => {
  const profile = profiles.getProfile(c.req.param('userId'));
  return c.json(profile);
});

app.post('/profile/score', async (c) => {
  const body = await c.req.json<UpdateScoreRequest>();
  profiles.updateFromQuiz(body.userId, body.domain, body.score);
  return c.json({ ok: true });
});

app.post('/profile/goal', async (c) => {
  const body = await c.req.json<SetGoalRequest>();
  profiles.setGoal(body.userId, body.goal);
  return c.json({ ok: true });
});

app.post('/style/detect', async (c) => {
  const { history } = await c.req.json<{ history: string[] }>();
  const style = detectStyle(history);
  return c.json({ style });
});

app.post('/teach', async (c) => {
  const body = await c.req.json<TeachRequest>();
  const bot = TUTORBOTS[body.domain];
  if (!bot) return c.json({ error: `Unknown domain: ${body.domain}` }, 400);

  const profile = profiles.getProfile(body.userId);
  const domainRecord = profile.domains[body.domain];
  const level = domainRecord?.level ?? 1;

  const content = await bot.teach(body.topic, level);
  return c.json({ content });
});

app.post('/quiz', async (c) => {
  const body = await c.req.json<QuizRequest>();
  const bot = TUTORBOTS[body.domain];
  if (!bot) return c.json({ error: `Unknown domain: ${body.domain}` }, 400);

  const questions = await bot.quiz(body.topic);
  return c.json({ questions });
});

app.post('/evaluate', async (c) => {
  const body = await c.req.json<EvaluateRequest>();
  const bot = TUTORBOTS['crypto'];
  const score = await bot!.evaluate(body.answer, body.question);
  return c.json(score);
});

app.post('/plan', async (c) => {
  const body = await c.req.json<PlanRequest>();
  const plan = await createPlan(body.userId, body.topic);
  return c.json(plan);
});

const PORT = parseInt(process.env['TUTOR_PORT'] ?? '3008', 10);

console.log(`[onyx-tutor] Listening on port ${PORT}`);

export async function ask(question?: string, sessionId?: string) {
  const bot = TUTORBOTS["crypto"]; // Default to crypto
  return bot!.teach(question ?? "introduction", 1);
}

export async function getUserProgress(userId: string) {
  return progress.getHistory(userId);
}

export async function recordFeedback(payload: any) {
  return { ok: true };
}

export async function listSessions() {
  return [
    { id: "sess1", topic: "Bitcoin", lastActive: Date.now() },
    { id: "sess2", topic: "Solana", lastActive: Date.now() },
  ];
}

export async function deleteSession(id: string) {
  return { ok: true };
}

/**
 * Enhanced generateQuiz for library mode
 */
export async function generateQuizLibrary(topic: string, level?: number) {
  const { generateQuiz: gen } = await import('./sessions/quizzer.js');
  return gen(topic, (level as any) ?? 1);
}

export default {
  port: PORT,
  fetch: app.fetch,
};
