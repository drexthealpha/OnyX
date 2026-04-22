import type { Trajectory, Reward, PolicyUpdate } from "../types.js";

/**
 * GRPO — Group Relative Policy Optimisation.
 *
 * Algorithm (from OpenClaw-RL):
 *  1. Group trajectories by conversationId.
 *  2. For each group: compute relative reward = reward_i - mean(group_rewards).
 *  3. Gradient signal = mean of ALL relative rewards across ALL groups.
 *  4. affectedSkills = union of toolsUsed from trajectories with below-mean reward.
 *  5. Return PolicyUpdate.
 */
export function optimize(
  trajectories: Trajectory[],
  rewards: Reward[],
): PolicyUpdate {
  if (trajectories.length === 0) {
    return { timestamp: Date.now(), gradientSignal: 0, affectedSkills: [] };
  }

  // Build reward lookup
  const rewardById = new Map<string, number>();
  for (const r of rewards) {
    rewardById.set(r.trajectoryId, r.value);
  }

  // Group trajectories by conversationId
  const groups = new Map<string, Trajectory[]>();
  for (const t of trajectories) {
    const group = groups.get(t.conversationId) ?? [];
    group.push(t);
    groups.set(t.conversationId, group);
  }

  const allRelativeRewards: number[] = [];
  const affectedSkillSet = new Set<string>();

  for (const [, group] of groups) {
    // Compute group mean reward
    const groupRewards = group.map(t => rewardById.get(t.id) ?? 0.5);
    const groupMean = groupRewards.reduce((s, r) => s + r, 0) / groupRewards.length;

    for (let i = 0; i < group.length; i++) {
      const t = group[i];
      const r = groupRewards[i];
      const relativeReward = r - groupMean;
      allRelativeRewards.push(relativeReward);

      // Trajectories with below-mean reward → their skills are "affected"
      if (relativeReward < 0) {
        for (const skill of t.toolsUsed) {
          affectedSkillSet.add(skill);
        }
      }
    }
  }

  const gradientSignal =
    allRelativeRewards.length > 0
      ? allRelativeRewards.reduce((s, r) => s + r, 0) / allRelativeRewards.length
      : 0;

  return {
    timestamp: Date.now(),
    gradientSignal,
    affectedSkills: [...affectedSkillSet],
  };
}