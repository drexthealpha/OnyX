/**
 * Rate limiting per skill.
 * Token-bucket algorithm: each skill has a configurable requests-per-minute limit.
 * Defaults: 60 req/min per skill, 600 req/min global.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
}

const DEFAULT_SKILL_RPM = 60;
const DEFAULT_GLOBAL_RPM = 600;

export class RateLimiter {
  private readonly skillBuckets = new Map<string, Bucket>();
  private readonly skillConfigs = new Map<string, RateLimitConfig>();
  private globalBucket: Bucket;
  private readonly globalRpm: number;

  constructor(globalRpm = DEFAULT_GLOBAL_RPM) {
    this.globalRpm = globalRpm;
    this.globalBucket = { tokens: globalRpm, lastRefill: Date.now() };
  }

  /** Configure RPM for a specific skill. */
  configure(skillName: string, config: RateLimitConfig): void {
    this.skillConfigs.set(skillName, config);
  }

  /**
   * Check if a request is allowed. Consumes one token if allowed.
   * Returns true if allowed, false if rate-limited.
   */
  allow(skillName: string): boolean {
    this.refill(skillName);

    // Check global bucket first
    if (this.globalBucket.tokens < 1) return false;

    // Check skill-specific bucket
    const skillBucket = this.getSkillBucket(skillName);
    if (skillBucket.tokens < 1) return false;

    // Consume tokens
    this.globalBucket.tokens--;
    skillBucket.tokens--;
    return true;
  }

  /** Return remaining tokens for a skill. */
  remaining(skillName: string): { skill: number; global: number } {
    this.refill(skillName);
    return {
      skill: Math.floor(this.getSkillBucket(skillName).tokens),
      global: Math.floor(this.globalBucket.tokens),
    };
  }

  private refill(skillName: string): void {
    const now = Date.now();

    // Refill global bucket
    const globalElapsed = (now - this.globalBucket.lastRefill) / 60_000;
    this.globalBucket.tokens = Math.min(
      this.globalRpm,
      this.globalBucket.tokens + globalElapsed * this.globalRpm
    );
    this.globalBucket.lastRefill = now;

    // Refill skill bucket
    const skillRpm = this.skillConfigs.get(skillName)?.requestsPerMinute ?? DEFAULT_SKILL_RPM;
    const skillBucket = this.getSkillBucket(skillName);
    const skillElapsed = (now - skillBucket.lastRefill) / 60_000;
    skillBucket.tokens = Math.min(
      skillRpm,
      skillBucket.tokens + skillElapsed * skillRpm
    );
    skillBucket.lastRefill = now;
  }

  private getSkillBucket(skillName: string): Bucket {
    if (!this.skillBuckets.has(skillName)) {
      const rpm = this.skillConfigs.get(skillName)?.requestsPerMinute ?? DEFAULT_SKILL_RPM;
      this.skillBuckets.set(skillName, { tokens: rpm, lastRefill: Date.now() });
    }
    return this.skillBuckets.get(skillName)!;
  }
}