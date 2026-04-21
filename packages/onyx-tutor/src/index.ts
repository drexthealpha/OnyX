import { Hono } from 'hono';
import { ProfileStore } from './learner/profile.ts';
import { detectStyle } from './learner/style.ts';
import { GoalTracker } from './learner/goals.ts';
import { createPlan } from './sessions/planner.ts';
import { generateQuiz, evaluateAnswers } from './sessions/quizzer.ts';
import { ProgressTracker } from './sessions/progress.ts';
import { CryptoTutor } from './tutorbots/crypto-tutor.ts';
import { CodeTutor } from './tutorbots/code-tutor.ts';
import { ResearchTutor } from './tutorbots/research-tutor.ts';
import { FinanceTutor } from './tutorbots/finance-tutor.ts';
import type {
  TeachRequest,
  QuizRequest,
  EvaluateRequest,
  PlanRequest,
  UpdateScoreRequest,
  SetGoalRequest,
  TutorBot,
} from './types.ts';

export * from './types.ts';
export * from './learner/profile.ts';
export * from './learner/style.ts';
export * from './learner/goals.ts';
export * from './learner/preferences.ts';
export * from './sessions/planner.ts';
export * from './sessions/quizzer.ts';
export * from './sessions/progress.ts';
export * from './tutorbots/crypto-tutor.ts';
export * from './tutorbots/code-tutor.ts';
export * from './tutorbots/research-tutor.ts';
export * from './tutorbots/finance-tutor.ts';

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
  const score = await bot.evaluate(body.answer, body.question);
  return c.json(score);
});

app.post('/plan', async (c) => {
  const body = await c.req.json<PlanRequest>();
  const plan = await createPlan(body.userId, body.topic);
  return c.json(plan);
});

const PORT = parseInt(process.env.TUTOR_PORT ?? '3008', 10);

console.log(`[onyx-tutor] Listening on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};