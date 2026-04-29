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
export declare function optimize(trajectories: Trajectory[], rewards: Reward[]): PolicyUpdate;
//# sourceMappingURL=grpo.d.ts.map