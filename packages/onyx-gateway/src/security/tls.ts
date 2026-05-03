import { readFileSync } from "node:fs";

export interface TLSOptions {
  cert: string;
  key: string;
}

export function buildTLSConfig(env: Record<string, string | undefined>): TLSOptions | undefined {
  const certFile = env.TLS_CERT_FILE;
  const keyFile = env.TLS_KEY_FILE;
  if (!certFile || !keyFile) return undefined;
  return { cert: readFileSync(certFile).toString(), key: readFileSync(keyFile).toString() };
}

export function isTLSEnabled(env: Record<string, string | undefined>): boolean {
  return Boolean(env.TLS_CERT_FILE && env.TLS_KEY_FILE);
}