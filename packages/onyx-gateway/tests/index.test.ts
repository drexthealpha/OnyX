import { describe, it, expect } from 'vitest';
import { NAME } from '../src/index.js';

describe('onyx-gateway', () => {
  it('exports NAME', () => {
    expect(NAME).toBe('onyx-gateway');
  });
});