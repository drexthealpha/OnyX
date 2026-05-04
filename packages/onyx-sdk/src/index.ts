// packages/onyx-sdk/src/index.ts
// ─── ONYX SDK — public barrel ─────────────────────────────────────────────────

// Default export: OnyxClient class
export { OnyxClient } from './client.js';
export { default } from './client.js';

// Named config type
export type { OnyxClientConfig } from './client.js';

// All public types from all @onyx/* packages
export * from './types/index.js';

// Utilities
export * from './utils/solana.js';
export * from './utils/crypto.js';

// Version
export const SDK_VERSION = '0.1.0';
export const NAME = 'onyx-sdk';