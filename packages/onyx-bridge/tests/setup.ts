import { vi } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

vi.mock('@grpc/grpc-js', () => {
  return require('@grpc/grpc-js');
});
