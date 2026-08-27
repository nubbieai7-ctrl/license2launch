/**
 * License2Launch — auth helpers (M1)
 * Session cookie auth: httpOnly cookie holding a crypto-random token that maps
 * to a row in the `sessions` table. Passwords hashed/verified with Bun.password.
 *
 * Cookie is set/read via the TanStack Start request-scoped helpers
 * (getCookie/setCookie/deleteCookie from "@tanstack/react-start/server"),
 * which the server-fn layer (fns.ts) uses. This module is pure logic + DB.
 */
import type { Database } from "bun:sqlite";

export const SESSION_COOKIE = "l2l_session";
/** 30 days in seconds. */
const SESSION_TTL = 60 * 60 * 24 * 30;

export interface Identity {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
}

export function createSession(d: Database, userId: number): string {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
  d.query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($token, $user_id, $expires)`,
  ).run({ $token: token, $user_id: userId, $expires: expires });
  return token;
}

export function identityFromToken(
  d: Database,
  token: string | undefined,
): Identity | null {
  if (!token) return null;
  const row = d
    .query(
      `SELECT u.id, u.email, u.name, u.role, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = $token`,
    )
    .get({ $token: token }) as
    | { id: number; email: string; name: string; role: "user" | "admin"; expires_at: string }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    // Expired — clean up and treat as logged out.
    d.query("DELETE FROM sessions WHERE token = $token").run({ $token: token });
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function destroySession(d: Database, token: string | undefined): void {
  if (!token) return;
  d.query("DELETE FROM sessions WHERE token = $token").run({ $token: token });
}
