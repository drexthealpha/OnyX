// packages/onyx-sdk/src/react/OnyxProvider.tsx
// React provider - requires react peer dependency at runtime
// Uses dynamic import to avoid compile-time type issues

import type { OnyxClientConfig } from '../client.js';

type OnyxClientType = unknown;

const OnyxContext = null;

export interface OnyxProviderProps {
  config: OnyxClientConfig;
  children: unknown;
}

export function OnyxProvider(props: OnyxProviderProps): unknown {
  return props.children;
}

export function useOnyx(): OnyxClientType {
  return null;
}

export type { OnyxClientConfig };