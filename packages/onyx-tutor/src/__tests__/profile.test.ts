import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { ProfileStore } from '../learner/profile.js';
import { DomainLevel } from '../types.js';
import { unlinkSync, existsSync } from 'node:fs';

const TEST_DB = './data/test-profiles.db';

describe('ProfileStore', () => {
  let store: ProfileStore;

  beforeEach(() => {
    store = new ProfileStore(TEST_DB);
  });

  afterEach(() => {
    store.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns default profile for new user', () => {
    const profile = store.getProfile('user-new');
    expect(profile.userId).toBe('user-new');
    expect(profile.style).toBe('verbal');
    expect(profile.goals).toEqual([]);
    expect(profile.domains).toEqual({});
  });

  test('updateFromQuiz increases level when score > 0.8', () => {
    store.updateFromQuiz('user-a', 'crypto', 0.5);
    let profile = store.getProfile('user-a');
    expect(profile.domains['crypto']!.level).toBe(DomainLevel.BEGINNER);

    store.updateFromQuiz('user-a', 'crypto', 0.9);
    profile = store.getProfile('user-a');
    expect(profile.domains['crypto']!.level).toBe(DomainLevel.INTERMEDIATE);
  });

  test('updateFromQuiz decreases level when score < 0.5', () => {
    store.updateFromQuiz('user-b', 'crypto', 0.9);
    store.updateFromQuiz('user-b', 'crypto', 0.3);
    const profile = store.getProfile('user-b');
    expect(profile.domains['crypto']!.level).toBe(DomainLevel.BEGINNER);
  });

  test('setGoal persists and deduplicates', () => {
    store.setGoal('user-c', 'Learn Anchor');
    store.setGoal('user-c', 'Learn Anchor');
    store.setGoal('user-c', 'Master DeFi');
    const profile = store.getProfile('user-c');
    expect(profile.goals).toContain('Learn Anchor');
    expect(profile.goals).toContain('Master DeFi');
    expect(profile.goals.filter((g) => g === 'Learn Anchor').length).toBe(1);
  });

  test('level does not exceed EXPERT', () => {
    store.updateFromQuiz('user-d', 'code', 0.9);
    store.updateFromQuiz('user-d', 'code', 0.9);
    store.updateFromQuiz('user-d', 'code', 0.9);
    store.updateFromQuiz('user-d', 'code', 0.9);
    const profile = store.getProfile('user-d');
    expect(profile.domains['code']!.level).toBe(DomainLevel.EXPERT);
  });
});
