import type { LearnerProfile } from '../types.js';

export class GoalTracker {
  inferGoals(profile: LearnerProfile): string[] {
    const inferred: string[] = [];

    for (const [domain, record] of Object.entries(profile.domains)) {
      const daysSinceUpdate = (Date.now() - record.lastUpdated) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate < 7 && record.level === 2) {
        inferred.push(`Advance to advanced level in ${domain}`);
      }

      if (record.confidence < 0.4) {
        inferred.push(`Strengthen fundamentals in ${domain}`);
      }
    }

    return inferred;
  }

  matchGoals(topic: string, goals: string[]): string[] {
    const topicLower = topic.toLowerCase();
    return goals.filter((g) => {
      const words = g.toLowerCase().split(/\s+/);
      return words.some((w) => w.length > 3 && topicLower.includes(w));
    });
  }

  suggestNextSteps(profile: LearnerProfile): string[] {
    const suggestions: string[] = [];

    let weakestDomain: string | null = null;
    let lowestConfidence = Infinity;

    for (const [domain, record] of Object.entries(profile.domains)) {
      if (record.confidence < lowestConfidence) {
        lowestConfidence = record.confidence;
        weakestDomain = domain;
      }
    }

    if (weakestDomain && lowestConfidence < 0.6) {
      suggestions.push(`Review ${weakestDomain} fundamentals to build confidence`);
    }

    for (const goal of profile.goals.slice(0, 2)) {
      suggestions.push(`Work toward goal: "${goal}"`);
    }

    if (Object.keys(profile.domains).length === 0) {
      suggestions.push('Start with a quiz in your primary domain of interest');
    }

    return suggestions.slice(0, 3);
  }
}
