/**
 * Cross-skill insight extraction.
 * Analyses trajectory JSONL files to produce usage reports,
 * performance trends, and improvement recommendations.
 */

import fs from 'fs';
import path from 'path';
import { loadTrajectories } from './trajectory';

export interface SkillInsight {
  skillName: string;
  totalRuns: number;
  avgLatencyMs: number;
  avgTokensUsed: number;
  uniqueUsers: number;
  lastRun: string | null;
}

export interface InsightReport {
  generatedAt: string;
  totalSkills: number;
  totalRuns: number;
  skills: SkillInsight[];
  topByRuns: string[];
  topByLatency: string[];
}

const TRAJECTORY_DIR = process.env.HERMES_TRAJECTORY_DIR
  ?? path.resolve(process.cwd(), '.agents', 'trajectories');

/** Extract cross-skill insights from all trajectory files. */
export function extractInsights(): InsightReport {
  const skillInsights = new Map<string, SkillInsight>();

  if (!fs.existsSync(TRAJECTORY_DIR)) {
    return {
      generatedAt: new Date().toISOString(),
      totalSkills: 0,
      totalRuns: 0,
      skills: [],
      topByRuns: [],
      topByLatency: [],
    };
  }

  // Scan all trajectory files
  const files = fs.readdirSync(TRAJECTORY_DIR).filter((f) => f.endsWith('-trajectories.jsonl'));

  for (const file of files) {
    const skillName = file.replace('-trajectories.jsonl', '');
    const records = loadTrajectories(skillName);

    if (records.length === 0) continue;

    const totalLatency = records.reduce((s, r) => s + (r.metadata.latencyMs ?? 0), 0);
    const totalTokens = records.reduce((s, r) => s + (r.metadata.tokensUsed ?? 0), 0);
    const users = new Set(records.map((r) => r.metadata.userId).filter(Boolean));
    const timestamps = records
      .map((r) => r.metadata.timestamp)
      .filter(Boolean)
      .sort();

    skillInsights.set(skillName, {
      skillName,
      totalRuns: records.length,
      avgLatencyMs: Math.round(totalLatency / records.length),
      avgTokensUsed: Math.round(totalTokens / records.length),
      uniqueUsers: users.size,
      lastRun: timestamps[timestamps.length - 1] ?? null,
    });
  }

  const skills = Array.from(skillInsights.values());
  const totalRuns = skills.reduce((s, sk) => s + sk.totalRuns, 0);

  const topByRuns = [...skills]
    .sort((a, b) => b.totalRuns - a.totalRuns)
    .slice(0, 5)
    .map((s) => s.skillName);

  const topByLatency = [...skills]
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 5)
    .map((s) => s.skillName);

  return {
    generatedAt: new Date().toISOString(),
    totalSkills: skills.length,
    totalRuns,
    skills: skills.sort((a, b) => b.totalRuns - a.totalRuns),
    topByRuns,
    topByLatency,
  };
}