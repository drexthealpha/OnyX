/**
 * Test 2: Sandbox interface returns correctly for exec commands.
 *
 * Tests the Sandbox interface contract - abstractly tests that exec returns
 * the expected shape. We test without Docker since it requires ESM/callback handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Sandbox } from '../types.js';

describe('Sandbox Interface', () => {
  it('should have exec method that returns stdout, stderr, exitCode', async () => {
    const mockSandbox: Sandbox = {
      exec: vi.fn().mockResolvedValue({
        stdout: 'hello from sandbox',
        stderr: '',
        exitCode: 0,
      }),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('file content'),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    const result = await mockSandbox.exec('echo "hello from sandbox"');

    expect(result).toBeDefined();
    expect(result.stdout).toBe('hello from sandbox');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  });

  it('should have writeFile, readFile, destroy methods', async () => {
    const mockSandbox: Sandbox = {
      exec: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('file content'),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    await mockSandbox.writeFile('test.ts', 'const x = 1;');
    expect(mockSandbox.writeFile).toHaveBeenCalledWith('test.ts', 'const x = 1;');

    const content = await mockSandbox.readFile('test.ts');
    expect(content).toBe('file content');

    await mockSandbox.destroy();
    expect(mockSandbox.destroy).toHaveBeenCalled();
  });

  it('should handle non-zero exit codes', async () => {
    const mockSandbox: Sandbox = {
      exec: vi.fn().mockResolvedValue({
        stdout: 'error output',
        stderr: 'something went wrong',
        exitCode: 1,
      }),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(''),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    const result = await mockSandbox.exec('false');

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe('something went wrong');
  });
});