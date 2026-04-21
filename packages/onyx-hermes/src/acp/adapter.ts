/**
 * ACP HTTP adapter — Express server exposing:
 *   POST /skill/:name  — execute a named skill
 *   GET  /skills       — list all available skills
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth';
import { canExecuteSkill } from './permissions';
import { SessionManager } from './session';
import { ToolRegistry } from './tools';
import { SkillImprover } from '../evolution/skill-improver';
import { recordTrajectory } from '../trajectory';
import { skillEvents, SkillEventType } from './events';
import { SkillMetadataStore } from '../routing/metadata';

const sessions = new SessionManager();
const tools = new ToolRegistry();
const improver = new SkillImprover();
const metadata = new SkillMetadataStore();

export function createAcpServer(): Application {
  const app = express();

  app.use(express.json({ limit: '4mb' }));
  app.use(authMiddleware);

  /**
   * POST /skill/:name
   * Body: { input: string, sessionId?: string, userId?: string }
   * Response: { result: string, tokensUsed: number, latencyMs: number }
   */
  app.post('/skill/:name', async (req: Request, res: Response) => {
    const skillName = req.params.name;
    const { input = '', sessionId, userId = 'anonymous' } = req.body as {
      input?: string;
      sessionId?: string;
      userId?: string;
    };

    // Permission check
    if (!canExecuteSkill(userId, skillName)) {
      res.status(403).json({ error: `Access denied to skill: ${skillName}` });
      return;
    }

    // Resolve or create session
    const sid = sessionId ?? sessions.create(userId);
    sessions.touch(sid);

    const startMs = Date.now();
    let result = '';
    let tokensUsed = 0;

    try {
      // Emit pre-execution event
      skillEvents.emit(SkillEventType.BEFORE_EXECUTE, { skillName, input, sessionId: sid });

      // Execute skill via tool registry
      const execResult = await tools.execute(skillName, input, sid);
      result = execResult.output;
      tokensUsed = execResult.tokensUsed;

      const latencyMs = Date.now() - startMs;

      // Record trajectory
      await recordTrajectory({
        skillName,
        input,
        output: result,
        tokensUsed,
        latencyMs,
        sessionId: sid,
        userId,
      });

      // Async skill improvement (fire-and-forget, never blocks response)
      void improver.maybeImprove(skillName).catch(() => {});

      // Emit post-execution event
      skillEvents.emit(SkillEventType.AFTER_EXECUTE, {
        skillName,
        result,
        tokensUsed,
        latencyMs,
        sessionId: sid,
      });

      res.json({ result, tokensUsed, latencyMs });
    } catch (err) {
      const latencyMs = Date.now() - startMs;
      const message = err instanceof Error ? err.message : String(err);

      skillEvents.emit(SkillEventType.EXECUTE_ERROR, { skillName, error: message, sessionId: sid });

      res.status(500).json({ error: `Skill execution failed: ${message}`, tokensUsed, latencyMs });
    }
  });

  /**
   * GET /skills
   * Response: { skills: SkillMeta[] }
   */
  app.get('/skills', (_req: Request, res: Response) => {
    const skills = metadata.listAll();
    res.json({ skills });
  });

  // 404 catch-all
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[onyx-hermes] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}