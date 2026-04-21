/**
 * Test 1: Compressor reduces text to under maxTokens
 */

import { compress } from '../context/compressor';

describe('compress()', () => {
  const CHARS_PER_TOKEN = 4;

  it('returns text unchanged when already within budget', () => {
    const text = 'Hello world.';
    const maxTokens = 100;
    const result = compress(text, maxTokens);
    expect(result).toBe(text);
  });

  it('reduces a long text to under maxTokens', () => {
    // Generate a text that is 500 tokens worth of content
    const sentences = Array.from({ length: 50 }, (_, i) =>
      `This is sentence number ${i + 1} about a very important topic that needs to be covered in detail.`
    );
    const text = sentences.join(' ');
    const maxTokens = 100;

    const result = compress(text, maxTokens);
    const resultTokens = Math.ceil(result.length / CHARS_PER_TOKEN);

    expect(resultTokens).toBeLessThanOrEqual(maxTokens);
    expect(result.length).toBeGreaterThan(0);
  });

  it('preserves high-TF-IDF content when compressing', () => {
    // Sentences mentioning "critical" should score higher
    const text = [
      'This is a filler sentence about nothing in particular.',
      'The critical system failure requires immediate attention.',
      'Another filler sentence with common words.',
      'Critical alert: the critical component is critically broken.',
      'Unrelated text about the weather and other mundane topics.',
    ].join(' ');

    const result = compress(text, 50);
    // The word "critical" appears most — those sentences should survive
    expect(result.toLowerCase()).toContain('critical');
  });

  it('handles a single very long sentence by truncating', () => {
    const longSentence = 'a'.repeat(10000);
    const maxTokens = 10;
    const result = compress(longSentence, maxTokens);
    const resultTokens = Math.ceil(result.length / 4);
    expect(resultTokens).toBeLessThanOrEqual(maxTokens);
  });

  it('handles empty string input', () => {
    const result = compress('', 100);
    expect(result).toBe('');
  });
});