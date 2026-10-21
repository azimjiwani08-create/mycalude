import "server-only";
import { isLive } from "@/lib/env";
import { MemoryDb } from "./memory";
import { SupabaseDb } from "./supabase";
import type { Db } from "./types";

export type { Db } from "./types";

// One demo store per server process; survives dev hot reloads.
const g = globalThis as unknown as { __eduDemoDb?: MemoryDb };
export function demoDb(): MemoryDb {
  return (g.__eduDemoDb ??= new MemoryDb());
}

/** Reset demo data (admin button, tests). */
export function resetDemoDb() {
  g.__eduDemoDb = new MemoryDb();
}

/**
 * The privileged database for server code. Route handlers check role and
 * office themselves (lib/access.ts) before calling it; Postgres RLS is the
 * second wall for user-scoped reads (see userDb).
 */
export function serverDb(): Db {
  return isLive() ? SupabaseDb.service() : demoDb();
}

/** A database handle scoped to the signed-in user's JWT (RLS applies). */
export function userDb(accessToken: string | null): Db {
  if (isLive() && accessToken) return SupabaseDb.asUser(accessToken);
  return demoDb();
}
