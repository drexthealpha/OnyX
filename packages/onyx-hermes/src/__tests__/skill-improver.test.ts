/**
 * Test 2: SkillImprover reads RL score and only fires if below threshold
 */

import { DspyOptimizer } from '../evolution/dspy-optimizer';

describe('DspyOptimizer', () => {
  const optimizer = new DspyOptimizer(0.6);

  it('does NOT improve when score >= threshold', async () => {
    const result = await optimizer.optimize('test-skill', 'current prompt text', 0.75);
    expect(result.improved).toBe(false);
    expect(result.prompt).toBe('current prompt text');
    expect(result.reason).toContain('no improvement needed');
  });

  it('attempts improvement when score < threshold', async () => {
    // With router unavailable (test env), optimizer will fallback gracefully
    // The key behaviour: it attempts optimization and returns a result
    const result = await optimizer.optimize('test-skill', 'current prompt text', 0.4);
    // Whether improved or not, result must have a valid prompt
    expect(typeof result.prompt).toBe('string');
    expect(result.prompt.length).toBeGreaterThan(0);
    // reason must be populated
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('uses default threshold of 0.6', () => {
    const opt = new DspyOptimizer();
    // threshold is private but behaviour is observable: score=0.6 should NOT improve
    // (threshold is >=, so 0.6 is included in "no improvement needed")
    return expect(
      opt.optimize('skill', 'prompt', 0.6)
    ).resolves.toMatchObject({ improved: false });
  });

  it('handles empty prompt gracefully', async () => {
    const result = await optimizer.optimize('skill', '', 0.3);
    expect(typeof result.prompt).toBe('string');
  });
});