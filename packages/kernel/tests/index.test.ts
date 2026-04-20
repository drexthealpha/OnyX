import { describe, it, expect } from 'vitest';
import { NAME } from '../src/index.js';

describe('kernel', () => {
  it('exports NAME', () => {
    expect(NAME).toBe('kernel');
  });
});