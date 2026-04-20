import { describe, it, expect } from 'vitest';
import { NAME } from '../src/index.js';

describe('onyx-research', () => {
  it('exports NAME', () => {
    expect(NAME).toBe('onyx-research');
  });
});