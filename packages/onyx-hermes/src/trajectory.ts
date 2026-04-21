/**
 * Trajectory recording — saves per-skill run records in ShareGPT-compatible JSONL.
 * Used for RL training data collection (onyx-rl layer).
 */

import fs from 'fs';
import path from 'path';

export interface TrajectoryEntry {
  skillName: string;
  input: string;
  output: string;
  tokensUsed: number;
  latencyMs: number;
  sessionId: string;
  userId: string;
}

interface TrajectoryRecord {
  conversations: Array<{ from: 'human' | 'gpt'; value: string }>;
  metadata: {
    skillName: string;
    tokensUsed: number;
    latencyMs: number;
    sessionId: string;
    userId: string;
    timestamp: string;
  };
}

const TRAJECTORY_DIR = process.env.HERMES_TRAJECTORY_DIR
  ?? path.resolve(process.cwd(), '.agents', 'trajectories');

export async function recordTrajectory(entry: TrajectoryEntry): Promise<void> {
  try {
    fs.mkdirSync(TRAJECTORY_DIR, { recursive: true });

    const record: TrajectoryRecord = {
      conversations: [
        { from: 'human', value: entry.input },
        { from: 'gpt', value: entry.output },
      ],
      metadata: {
        skillName: entry.skillName,
        tokensUsed: entry.tokensUsed,
        latencyMs: entry.latencyMs,
        sessionId: entry.sessionId,
        userId: entry.userId,
        timestamp: new Date().toISOString(),
      },
    };

    const filename = path.join(TRAJECTORY_DIR, `${entry.skillName}-trajectories.jsonl`);
    fs.appendFileSync(filename, JSON.stringify(record) + '\n', 'utf-8');
  } catch (err) {
    // Trajectory recording is non-fatal
    console.warn('[trajectory] Failed to record:', err);
  }
}

/** Load all trajectory records for a skill. */
export function loadTrajectories(skillName: string): TrajectoryRecord[] {
  const filename = path.join(TRAJECTORY_DIR, `${skillName}-trajectories.jsonl`);
  if (!fs.existsSync(filename)) return [];

  const lines = fs.readFileSync(filename, 'utf-8').split('\n').filter(Boolean);
  const records: TrajectoryRecord[] = [];

  for (const line of lines) {
    try {
      records.push(JSON.parse(line) as TrajectoryRecord);
    } catch {
      // Skip malformed lines
    }
  }

  return records;
}