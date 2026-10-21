import "server-only";
import { z, ZodError, type ZodTypeAny } from "zod";
import { HttpError } from "@/lib/access";
import { demoDb, serverDb, type Db } from "@/lib/db";
import { isLive } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import type { Role, SessionUser } from "@/lib/types";

export interface Ctx<I> {
  req: Request;
  input: I;
  user: SessionUser | null;
  accessToken: string | null;
  ip: string;
  db: Db;
  /** False in demo mode and during a demo fallback. */
  live: boolean;
  params: Record<string, string>;
}

interface RouteOpts<S extends ZodTypeAny> {
  /** Who may call. Omit for public routes. */
  roles?: Role[];
  schema?: S;
  /** Reject bodies larger than this. Default 64 KB. */
  maxBytes?: number;
  /** Requests per window. Default 30/min per user and 60/min per IP. */
  limit?: { perUser?: number; perIp?: number; windowMs?: number };
  /**
   * What to do if the live backend throws. "demo" (reads) re-runs the handler
   * against sample data; "error" (writes) returns 503 so nothing is falsely
   * reported as saved.
   */
  onBackendError?: "demo" | "error";
  handler: (ctx: Ctx<z.infer<S>>) => Promise<unknown>;
}

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

async function readInput(req: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new HttpError(413, "That is too large to send.");
  if (req.method === "GET" || req.method === "HEAD") {
    return Object.fromEntries(new URL(req.url).searchParams);
  }
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    const out: Record<string, unknown> = {};
    for (const [k, v] of form.entries()) {
      if (typeof v !== "string" && v.size > maxBytes) throw new HttpError(413, "That file is too large.");
      out[k] = v;
    }
    return out;
  }
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "That is too large to send.");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Malformed request.");
  }
}

function toResponse(result: unknown, headers?: HeadersInit): Response {
  if (result instanceof Response) return result;
  return Response.json(result ?? { ok: true }, { headers });
}

function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message, code: err.code }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return Response.json({ error: "Please check the form and try again.", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  console.error("[edu] unhandled", err);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/**
 * The fixed request pipeline (instruction §A): authenticate → validate →
 * rate-limit → demo check → handler. Every API route goes through this.
 */
export function route<S extends ZodTypeAny = z.ZodUnknown>(opts: RouteOpts<S>) {
  return async (req: Request, segment: { params: Promise<any> }): Promise<Response> => {
    try {
      // A2. Authenticate and load role + office.
      const session = await getSession().catch(() => null);
      const user = session?.user ?? null;
      if (opts.roles) {
        if (!user) throw new HttpError(401, "Please log in.");
        if (!opts.roles.includes(user.role)) throw new HttpError(403, "You do not have access to this.");
      }

      // A3. Validate input with a schema; reject oversized or malformed.
      const raw = await readInput(req, opts.maxBytes ?? 64 * 1024);
      const input = opts.schema ? opts.schema.parse(raw) : raw;

      // A4. Rate-limit per user and per IP.
      const ip = clientIp(req);
      const windowMs = opts.limit?.windowMs ?? 60_000;
      const path = new URL(req.url).pathname;
      const byIp = rateLimit(`ip:${ip}:${path}`, opts.limit?.perIp ?? 60, windowMs);
      const byUser = user ? rateLimit(`u:${user.id}:${path}`, opts.limit?.perUser ?? 30, windowMs) : { ok: true, retryAfterS: 0 };
      if (!byIp.ok || !byUser.ok) {
        return Response.json(
          { error: "Too many requests. Please wait a moment." },
          { status: 429, headers: { "Retry-After": String(Math.max(byIp.retryAfterS, byUser.retryAfterS)) } },
        );
      }

      const params = ((await segment?.params) ?? {}) as Record<string, string>;
      const live = isLive();
      const ctx: Ctx<z.infer<S>> = { req, input, user, accessToken: session?.accessToken ?? null, ip, db: serverDb(), live, params };

      // A5. Demo flag: serverDb() is the sample store when not live, so the
      // same handler serves sample data and never touches a real backend.
      try {
        return toResponse(await opts.handler(ctx), live ? undefined : { "x-edu-mode": "demo" });
      } catch (err) {
        if (!live || err instanceof HttpError || err instanceof ZodError) throw err;
        console.error("[edu] backend failed", err);
        if ((opts.onBackendError ?? (req.method === "GET" ? "demo" : "error")) === "demo") {
          return toResponse(await opts.handler({ ...ctx, db: demoDb(), live: false }), { "x-edu-mode": "demo-fallback" });
        }
        throw new HttpError(503, "We could not save that just now. Please try again, or message us on WhatsApp.");
      }
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** For server components: live DB with automatic fallback to sample data. */
export async function withPageDb<T>(fn: (db: Db, live: boolean) => Promise<T>): Promise<T> {
  if (!isLive()) return fn(demoDb(), false);
  try {
    return await fn(serverDb(), true);
  } catch (err) {
    console.error("[edu] page backend failed, using demo data", err);
    return fn(demoDb(), false);
  }
}
