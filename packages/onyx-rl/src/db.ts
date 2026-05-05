import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import { mkdirSync } from "node:fs";
import type { Trajectory, OutcomeRecord, FeedbackRecord, PolicyUpdate } from "./types.js";

// Ensure data directory exists
mkdirSync("./data", { recursive: true });

export const db: DatabaseType = new Database("./data/rl.db");

// ─── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS trajectories (
    id            TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    message       TEXT NOT NULL,
    response      TEXT NOT NULL,
    toolsUsed     TEXT NOT NULL DEFAULT '[]',
    latencyMs     REAL NOT NULL,
    tokensUsed    INTEGER NOT NULL,
    timestamp     INTEGER NOT NULL,
    processed     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS outcomes (
    trajectoryId  TEXT PRIMARY KEY,
    success       INTEGER NOT NULL,
    details       TEXT NOT NULL,
    recordedAt    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feedback (
    trajectoryId  TEXT PRIMARY KEY,
    thumbsUp      INTEGER NOT NULL,
    recordedAt    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS policy_updates (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp     INTEGER NOT NULL,
    gradientSignal REAL NOT NULL,
    affectedSkills TEXT NOT NULL DEFAULT '[]'
  );

  CREATE INDEX IF NOT EXISTS idx_trajectories_conversation
    ON trajectories (conversationId);

  CREATE INDEX IF NOT EXISTS idx_trajectories_processed
    ON trajectories (processed);

  CREATE INDEX IF NOT EXISTS idx_trajectories_timestamp
    ON trajectories (timestamp);
`);

// ─── Typed query helpers ─────────────────────────────────────────────────────

const _insertTrajectory = db.prepare(`
  INSERT OR IGNORE INTO trajectories
    (id, conversationId, message, response, toolsUsed, latencyMs, tokensUsed, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

export function insertTrajectory(t: Trajectory): void {
  _insertTrajectory.run([
    t.id,
    t.conversationId,
    t.message,
    t.response,
    JSON.stringify(t.toolsUsed),
    t.latencyMs,
    t.tokensUsed,
    t.timestamp,
  ]);
}

const _getTrajectory = db.prepare(`SELECT * FROM trajectories WHERE id = ?`);

export function getTrajectory(id: string): Trajectory | null {
  const row = _getTrajectory.get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    conversationId: row.conversationId,
    message: row.message,
    response: row.response,
    toolsUsed: JSON.parse(row.toolsUsed),
    latencyMs: row.latencyMs,
    tokensUsed: row.tokensUsed,
    timestamp: row.timestamp,
  };
}

const _unprocessedTrajectories = db.prepare(`SELECT * FROM trajectories WHERE processed = 0 ORDER BY timestamp ASC LIMIT 200`);

export function loadUnprocessedTrajectories(): Trajectory[] {
  return (_unprocessedTrajectories.all() as any[]).map(row => ({
    id: row.id as string,
    conversationId: row.conversationId as string,
    message: row.message as string,
    response: row.response as string,
    toolsUsed: JSON.parse(row.toolsUsed as string),
    latencyMs: row.latencyMs as number,
    tokensUsed: row.tokensUsed as number,
    timestamp: row.timestamp as number,
  }));
}

const _markProcessed = db.prepare(
  `UPDATE trajectories SET processed = 1 WHERE id = ?`
);

export function markTrajectoryProcessed(id: string): void {
  _markProcessed.run([id]);
}

const _countUnprocessed = db.prepare(
  `SELECT COUNT(*) as count FROM trajectories WHERE processed = 0`
);

export function countUnprocessedTrajectories(): number {
  return (_countUnprocessed.get() as any)?.count ?? 0;
}

// ─── Outcome helpers ─────────────────────────────────────────────────────────

const _insertOutcome = db.prepare(`
  INSERT OR REPLACE INTO outcomes (trajectoryId, success, details, recordedAt)
  VALUES (?, ?, ?, ?)
`);

export function insertOutcome(o: OutcomeRecord): void {
  _insertOutcome.run([o.trajectoryId, o.success ? 1 : 0, o.details, o.recordedAt]);
}

const _getOutcome = db.prepare(
  `SELECT * FROM outcomes WHERE trajectoryId = ?`
);

export function getOutcome(trajectoryId: string): OutcomeRecord | null {
  const row = _getOutcome.get(trajectoryId) as any;
  if (!row) return null;
  return { trajectoryId: row.trajectoryId, success: Boolean(row.success), details: row.details, recordedAt: row.recordedAt };
}

// ─── Feedback helpers ────────────────────────────────────────────────────────

const _insertFeedback = db.prepare(`
  INSERT OR REPLACE INTO feedback (trajectoryId, thumbsUp, recordedAt)
  VALUES (?, ?, ?)
`);

export function insertFeedback(f: FeedbackRecord): void {
  _insertFeedback.run([f.trajectoryId, f.thumbsUp ? 1 : 0, f.recordedAt]);
}

const _getFeedback = db.prepare(
  `SELECT * FROM feedback WHERE trajectoryId = ?`
);

export function getFeedback(trajectoryId: string): FeedbackRecord | null {
  const row = _getFeedback.get(trajectoryId) as any;
  if (!row) return null;
  return { trajectoryId: row.trajectoryId, thumbsUp: Boolean(row.thumbsUp), recordedAt: row.recordedAt };
}

// ─── Policy update helpers ───────────────────────────────────────────────────

const _insertPolicyUpdate = db.prepare(`
  INSERT INTO policy_updates (timestamp, gradientSignal, affectedSkills)
  VALUES (?, ?, ?)
`);

export function savePolicyUpdate(u: PolicyUpdate): void {
  _insertPolicyUpdate.run([u.timestamp, u.gradientSignal, JSON.stringify(u.affectedSkills)]);
}

// ─── Skill score query ───────────────────────────────────────────────────────
// Returns average reward for trajectories that used a given skill in the last 50 uses.
// Stored in toolsUsed JSON array; we use LIKE for a fast approximation.

export function getSkillAverageReward(_skillName: string): number {
  const stmt = db.prepare(`
    SELECT AVG(CASE WHEN o.success = 1 THEN 1.0 ELSE 0.0 END) as value
    FROM (
      SELECT t.id
      FROM trajectories t
      WHERE EXISTS (
        SELECT 1 FROM json_each(t.toolsUsed) WHERE value = ?
      )
      ORDER BY t.timestamp DESC
      LIMIT 50
    ) recent
    LEFT JOIN outcomes o ON o.trajectoryId = recent.id
  `);

  const row = stmt.get(_skillName) as any;
  return row?.value ?? 0.5;
}