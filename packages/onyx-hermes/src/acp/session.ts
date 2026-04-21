/**
 * Session management for ACP.
 * Sessions are in-memory with a configurable TTL (default 30 min).
 * Expired sessions are garbage-collected on each access.
 */

import { randomUUID } from 'crypto';

interface Session {
  id: string;
  userId: string;
  createdAt: number;
  lastAccessedAt: number;
  metadata: Record<string, unknown>;
}

const SESSION_TTL_MS = parseInt(process.env.HERMES_SESSION_TTL_MS ?? '1800000', 10); // 30 min

export class SessionManager {
  private readonly sessions = new Map<string, Session>();

  /** Create a new session for a user. Returns session ID. */
  create(userId: string, metadata: Record<string, unknown> = {}): string {
    this.gc();
    const id = randomUUID();
    this.sessions.set(id, {
      id,
      userId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      metadata,
    });
    return id;
  }

  /** Update last-accessed timestamp (keep-alive). */
  touch(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.lastAccessedAt = Date.now();
    return true;
  }

  /** Get session by ID. Returns null if not found or expired. */
  get(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() - session.lastAccessedAt > SESSION_TTL_MS) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  /** Destroy a session explicitly. */
  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** Garbage-collect expired sessions. */
  gc(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastAccessedAt > SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }

  /** Return count of active sessions. */
  count(): number {
    this.gc();
    return this.sessions.size;
  }
}