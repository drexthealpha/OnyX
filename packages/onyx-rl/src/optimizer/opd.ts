import type { Trajectory, Reward, PolicyUpdate } from "../types.js";

/**
 * OPD — Online Preference Distillation.
 *
 * When reward > threshold the trajectory is treated as a "teacher" sample.
 * The distillation hint is derived from the response content of high-reward
 * trajectories (what the model did right) vs low-reward trajectories.
 *
 * In the full OpenClaw-RL system a judge LLM extracts the hint; here we store
 * the structural signal for the downstream training runtime to act on.
 *
 * PolicyUpdate.affectedSkills contains skills from LOW-reward trajectories.
 * PolicyUpdate.gradientSignal is the mean token-level advantage direction:
 *   +1 = teacher is better, -1 = student is better (corrective).
 */

const HIGH_REWARD_THRESHOLD = 0.7;
const LOW_REWARD_THRESHOLD = 0.3;

export interface OPDPolicyUpdate extends PolicyUpdate {
  distillationHints: Array<{
    teacherResponse: string;
    studentResponse: string;
    advantageDirection: number; // +1 or -1
  }>;
}

export function distill(
  trajectories: Trajectory[],
  rewards: Reward[],
): OPDPolicyUpdate {
  const rewardById = new Map<string, number>();
  for (const r of rewards) {
    rewardById.set(r.trajectoryId, r.value);
  }

  // Separate into teacher (high reward) and student (low reward) pools
  const teachers: Array<{ trajectory: Trajectory; reward: number }> = [];
  const students: Array<{ trajectory: Trajectory; reward: number }> = [];

  for (const t of trajectories) {
    const rv = rewardById.get(t.id) ?? 0.5;
    if (rv >= HIGH_REWARD_THRESHOLD) teachers.push({ trajectory: t, reward: rv });
    else if (rv <= LOW_REWARD_THRESHOLD) students.push({ trajectory: t, reward: rv });
  }

  const affectedSkillSet = new Set<string>();
  for (const { trajectory } of students) {
    for (const skill of trajectory.toolsUsed) {
      affectedSkillSet.add(skill);
    }
  }

  const hints: OPDPolicyUpdate["distillationHints"] = [];
  const pairs = Math.min(teachers.length, students.length);

  for (let i = 0; i < pairs; i++) {
    hints.push({
      teacherResponse: teachers[i].trajectory.response,
      studentResponse: students[i].trajectory.response,
      advantageDirection: 1, // teacher is better → correct toward teacher
    });
  }

  // Gradient signal: proportion of teacher samples (positive = model improving)
  const total = trajectories.length;
  const gradientSignal = total > 0 ? (teachers.length - students.length) / total : 0;

  return {
    timestamp: Date.now(),
    gradientSignal: Math.min(1, Math.max(-1, gradientSignal)),
    affectedSkills: [...affectedSkillSet],
    distillationHints: hints,
  };
}