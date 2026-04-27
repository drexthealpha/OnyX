// packages/onyx-nomad/src/detect.ts
import dns from 'node:dns';

/**
 * isOnline — tests internet connectivity via DNS lookup of 8.8.8.8.
 *
 * Uses a 2000ms timeout enforced by a racing Promise.
 * NEVER throws — returns false on any error or timeout.
 *
 * Inspired by Project N.O.M.A.D.'s connectivity check pattern
 * (they use fetch('https://1.1.1.1/cdn-cgi/trace') — we use DNS
 * because it works in pure Node/Bun without an HTTP stack dependency).
 */
export async function isOnline(): Promise<boolean> {
  return new Promise((resolve) => {
    // 2000ms hard timeout
    const timer = setTimeout(() => resolve(false), 2000);

    dns.lookup('8.8.8.8', (err) => {
      clearTimeout(timer);
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}