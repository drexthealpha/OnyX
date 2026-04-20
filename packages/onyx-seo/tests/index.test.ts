import { describe, it, expect } from 'vitest';
import { NAME } from '../src/index.js';

describe('onyx-seo', () => {
  it('exports NAME', () => {
    expect(NAME).toBe('onyx-seo');
  });
});