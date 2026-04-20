import { describe, it, expect } from 'vitest';
import { NAME } from '../src/index.js';

describe('onyx-hermes-adapter', () => {
  it('exports NAME', () => {
    expect(NAME).toBe('onyx-hermes-adapter');
  });
});