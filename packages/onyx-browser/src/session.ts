import type { Cookie } from "./types.ts";

export class SessionCookieJar {
  private cookies: Map<string, Cookie[]> = new Map();

  importCookies(sessionId: string, cookies: Cookie[]): void {
    this.cookies.set(sessionId, cookies);
  }

  exportCookies(sessionId: string): Cookie[] {
    return this.cookies.get(sessionId) ?? [];
  }

  getCookiesForDomain(sessionId: string, domain: string): Cookie[] {
    const all = this.exportCookies(sessionId);
    return all.filter((c) => domain.includes(c.domain));
  }

  clearSession(sessionId: string): void {
    this.cookies.delete(sessionId);
  }
}

export const cookieJar = new SessionCookieJar();
