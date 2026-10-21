import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sessionSecret, isLive, env } from "@/lib/env";
import { serverDb } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";

const COOKIE = "edu_session";
const MAX_AGE_S = 60 * 60 * 24 * 7;

interface Payload {
  sub: string;            // users.id
  at?: string;            // Supabase access token (live)
  rt?: string;            // Supabase refresh token (live)
  exp: number;            // epoch seconds
}

function b64(s: string) {
  return Buffer.from(s).toString("base64url");
}
function sign(body: string) {
  return createHmac("sha256", sessionSecret()).update(body).digest("base64url");
}

export function encodeSession(p: Payload): string {
  const body = b64(JSON.stringify(p));
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined): Payload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    return p.exp > Date.now() / 1000 ? p : null;
  } catch {
    return null;
  }
}

export async function setSession(sub: string, tokens?: { at: string; rt: string }) {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession({ sub, at: tokens?.at, rt: tokens?.rt, exp: Math.floor(Date.now() / 1000) + MAX_AGE_S }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** Loads the user, their role, office and linked student/parent record. */
export async function getSession(): Promise<{ user: SessionUser; accessToken: string | null } | null> {
  const p = decodeSession((await cookies()).get(COOKIE)?.value);
  if (!p) return null;

  if (isLive()) {
    // Confirm the Supabase token is still valid before trusting it.
    if (!p.at) return null;
    const sb = createClient(env.supabaseUrl()!, env.supabaseAnonKey()!, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.getUser(p.at);
    if (error || !data.user || data.user.id !== p.sub) return null;
  }

  const user = await loadSessionUser(p.sub);
  return user ? { user, accessToken: p.at ?? null } : null;
}

export async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const db = serverDb();
  const [u] = await db.select("users", { id: userId });
  if (!u) return null;
  const [student] = u.role === "student" ? await db.select("students", { user_id: u.id }) : [];
  const [parent] = u.role === "parent" ? await db.select("parents", { user_id: u.id }) : [];
  return { ...u, student_id: student?.id ?? null, parent_id: parent?.id ?? null };
}
