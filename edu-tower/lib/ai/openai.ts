import "server-only";
import OpenAI from "openai";
import { env } from "@/lib/env";
import type { Db } from "@/lib/db";
import type { AiLog } from "@/lib/types";
import { HttpError } from "@/lib/access";
import { rateLimit } from "@/lib/rate-limit";

let client: OpenAI | null = null;
export function openai(): OpenAI {
  const key = env.openaiKey();
  if (!key) throw new Error("OPENAI_API_KEY missing");
  return (client ??= new OpenAI({ apiKey: key }));
}

// USD per 1M tokens. Update when pricing changes; used for the usage log only.
const PRICES: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
};
const STT_PER_MINUTE = 0.006;

export function estimateCost(model: string, inTok: number, outTok: number): number {
  const p = PRICES[model] ?? PRICES["gpt-4o-mini"];
  return (inTok * p.in + outTok * p.out) / 1_000_000;
}
export function sttCost(seconds: number) {
  return (seconds / 60) * STT_PER_MINUTE;
}

/** Per-user daily cap on AI calls (cost control). Anonymous visitors are capped per IP. */
export async function assertAiQuota(db: Db, userId: string | null, ip: string) {
  const limit = env.aiDailyLimit();
  const message = "You have reached today's limit for AI help. Please try again tomorrow, or message a counsellor on WhatsApp.";
  if (!userId) {
    if (!rateLimit(`ai-day:${ip}`, Math.ceil(limit / 4), 86_400_000).ok) throw new HttpError(429, message);
    return;
  }
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const logs = await db.select("ai_logs", { user_id: userId }, { gte: { column: "created_at", value: since.toISOString() } });
  if (logs.length >= limit) throw new HttpError(429, message);
}

export async function logAi(db: Db, entry: Omit<AiLog, "id" | "created_at">) {
  try {
    await db.insert("ai_logs", entry);
  } catch (err) {
    console.error("[edu] ai log failed", err);
  }
}

/** Chat call that must return JSON. Returns parsed object or null. */
export async function chatJson(system: string, user: string): Promise<{ json: unknown; inTok: number; outTok: number; model: string } | null> {
  const model = env.chatModel();
  const res = await openai().chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "";
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { json, inTok: res.usage?.prompt_tokens ?? 0, outTok: res.usage?.completion_tokens ?? 0, model };
}

export async function chatText(system: string, user: string): Promise<{ text: string; inTok: number; outTok: number; model: string }> {
  const model = env.chatModel();
  const res = await openai().chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return { text: res.choices[0]?.message?.content ?? "", inTok: res.usage?.prompt_tokens ?? 0, outTok: res.usage?.completion_tokens ?? 0, model };
}

export async function transcribe(file: File): Promise<{ text: string; seconds: number; model: string }> {
  const model = env.sttModel();
  const res = await openai().audio.transcriptions.create({ file, model, response_format: "verbose_json" });
  const r = res as unknown as { text: string; duration?: number };
  return { text: r.text, seconds: r.duration ?? 60, model };
}
