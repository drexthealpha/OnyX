/**
 * Skill Improver — orchestrates the improvement loop.
 *
 * After each skill use:
 *   1. Read score from GET http://localhost:${RL_PORT}/score/:skillName
 *   2. If score < 0.6: call DspyOptimizer, save result to .agents/skills/{name}/SKILL.md
 *   3. Log improvement via kernel phaseLog
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { DspyOptimizer } from './dspy-optimizer';
import { skillEvents, SkillEventType } from '../acp/events';

const RL_PORT = parseInt(process.env.RL_PORT ?? '6001', 10);
const IMPROVEMENT_THRESHOLD = 0.6;
const SKILLS_DIR = path.resolve(process.cwd(), '.agents', 'skills');

function fetchRlScore(skillName: string): Promise<number> {
  return new Promise((resolve) => {
    const url = `http://localhost:${RL_PORT}/score/${encodeURIComponent(skillName)}`;
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as { score?: number };
            resolve(typeof parsed.score === 'number' ? parsed.score : 0.5);
          } catch {
            resolve(0.5); // default neutral score
          }
        });
      })
      .on('error', () => {
        resolve(0.5); // RL service not running — neutral score
      });
  });
}

function readSkillPrompt(skillName: string): string | null {
  const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return null;
  return fs.readFileSync(skillPath, 'utf-8');
}

function writeSkillPrompt(skillName: string, content: string): void {
  const skillDir = path.join(SKILLS_DIR, skillName);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf-8');
}

function phaseLog(message: string): void {
  // Attempt to call kernel phaseLog; fallback to console
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const kernel = require('@onyx/kernel') as {
      phaseLog?: (msg: string) => void;
    };
    if (typeof kernel.phaseLog === 'function') {
      kernel.phaseLog(message);
      return;
    }
  } catch {
    // kernel not available
  }
  console.log(`[onyx-hermes:phaseLog] ${message}`);
}

export class SkillImprover {
  private readonly optimizer: DspyOptimizer;
  private readonly improving = new Set<string>(); // prevent concurrent improvements

  constructor(optimizer?: DspyOptimizer) {
    this.optimizer = optimizer ?? new DspyOptimizer(IMPROVEMENT_THRESHOLD);
  }

  /**
   * Check RL score for a skill and improve if below threshold.
   * Fire-and-forget safe — never throws.
   */
  async maybeImprove(skillName: string): Promise<void> {
    if (this.improving.has(skillName)) return; // already in progress

    this.improving.add(skillName);
    try {
      const score = await fetchRlScore(skillName);

      if (score >= IMPROVEMENT_THRESHOLD) return;

      const currentPrompt = readSkillPrompt(skillName);
      if (!currentPrompt) return;

      phaseLog(`[hermes] Skill "${skillName}" score ${score.toFixed(2)} < ${IMPROVEMENT_THRESHOLD} — triggering improvement`);

      const result = await this.optimizer.optimize(skillName, currentPrompt, score);

      if (result.improved) {
        writeSkillPrompt(skillName, result.prompt);
        phaseLog(`[hermes] Skill "${skillName}" prompt improved: ${result.reason}`);
        skillEvents.emit(SkillEventType.IMPROVED, {
          skillName,
          oldScore: score,
          newPrompt: result.prompt,
        });
      } else {
        phaseLog(`[hermes] Skill "${skillName}" no improvement: ${result.reason}`);
      }
    } finally {
      this.improving.delete(skillName);
    }
  }
}