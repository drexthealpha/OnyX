import type { TLSOptions } from "bun";

export function buildTLSConfig(env: Record<string, string | undefined>): TLSOptions | undefined {
  const certFile = env.TLS_CERT_FILE;
  const keyFile = env.TLS_KEY_FILE;
  if (!certFile || !keyFile) return undefined;
  return {
    cert: Bun.file(certFile),
    key: Bun.file(keyFile),
  };
}

export function isTLSEnabled(env: Record<string, string | undefined>): boolean {
  return Boolean(env.TLS_CERT_FILE && env.TLS_KEY_FILE);
}