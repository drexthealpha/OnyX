/**
 * Skill access control.
 * Maintains an in-memory allowlist per userId.
 * By default all skills are accessible (open policy).
 * Operators can restrict individual skills per user.
 */

interface AccessControl {
  mode: 'allow-all' | 'allowlist';
  allowedSkills: Set<string>;
}

const userPolicy = new Map<string, AccessControl>();

/** Check if a user can execute a named skill. */
export function canExecuteSkill(userId: string, skillName: string): boolean {
  const policy = userPolicy.get(userId);
  if (!policy || policy.mode === 'allow-all') return true;
  return policy.allowedSkills.has(skillName);
}

/** Grant access to a specific skill for a user. */
export function grantSkillAccess(userId: string, skillName: string): void {
  let policy = userPolicy.get(userId);
  if (!policy) {
    policy = { mode: 'allowlist', allowedSkills: new Set() };
    userPolicy.set(userId, policy);
  }
  if (policy.mode === 'allow-all') return; // already unrestricted
  policy.allowedSkills.add(skillName);
}

/** Revoke access to a specific skill for a user. Switches user to allowlist mode. */
export function revokeSkillAccess(userId: string, skillName: string): void {
  let policy = userPolicy.get(userId);
  if (!policy) {
    // First restriction — switch to allowlist mode with all skills except this one
    policy = { mode: 'allowlist', allowedSkills: new Set() };
    userPolicy.set(userId, policy);
    return;
  }
  if (policy.mode === 'allow-all') {
    policy.mode = 'allowlist';
    policy.allowedSkills.delete(skillName);
    return;
  }
  policy.allowedSkills.delete(skillName);
}

/** Reset a user to allow-all mode (remove restrictions). */
export function resetUserPolicy(userId: string): void {
  userPolicy.delete(userId);
}

/** List all users with custom policies. */
export function listPolicies(): Array<{ userId: string; mode: string; skills: string[] }> {
  return Array.from(userPolicy.entries()).map(([userId, policy]) => ({
    userId,
    mode: policy.mode,
    skills: Array.from(policy.allowedSkills),
  }));
}