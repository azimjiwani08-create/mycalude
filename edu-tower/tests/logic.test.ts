import { describe, expect, it } from "vitest";
import { roundBand, markObjective, bandFrom40, overallBand, weakestSkill } from "@/lib/marking";
import { redact } from "@/lib/ai/redact";
import { retrieve } from "@/lib/ai/retrieval";
import { estimateSchema } from "@/lib/ai/rubric";
import { fill, templateFor, validateTemplate } from "@/lib/ai/report-writer";
import { scoreHeuristic } from "@/lib/ai/scorer";
import { buildSeed } from "@/lib/demo/seed";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";
import type { WeekData } from "@/lib/types";

describe("marking", () => {
  it("rounds to IELTS half bands", () => {
    expect(roundBand(6.25)).toBe(6.5);
    expect(roundBand(6.75)).toBe(7);
    expect(roundBand(6.1)).toBe(6);
  });
  it("marks objective answers case-insensitively, by code", () => {
    const r = markObjective([{ id: "a", answer_key: "Four" }, { id: "b", answer_key: "Six" }, { id: "c", answer_key: null }], { a: " four ", b: "five" });
    expect(r).toMatchObject({ raw: 1, max: 2 });
  });
  it("uses the 40-item table", () => {
    expect(bandFrom40(30)).toBe(7);
    expect(bandFrom40(39)).toBe(9);
  });
  it("finds overall and weakest", () => {
    const s = { reading: 7, listening: 6.5, writing: 5.5, speaking: 6 };
    expect(overallBand(s)).toBe(6.5);
    expect(weakestSkill(s)).toBe("writing");
  });
});

describe("AI guard rails", () => {
  it("redacts phones, emails and names before logging", () => {
    const out = redact("I'm Riya Shah, call +91 98111 10001 or riya@example.com", ["Riya Shah"]);
    expect(out).not.toMatch(/Riya|Shah|98111|example\.com/);
  });
  it("retrieves approved content and returns nothing for off-topic questions", () => {
    const entries = buildSeed().content_entries;
    expect(retrieve("How much is the IELTS fee?", entries)[0].entry.kind).toBe("fee");
    expect(retrieve("What's the weather in Paris tomorrow?", entries)).toHaveLength(0);
    expect(retrieve("fees", entries.map((e) => ({ ...e, approved: false })))).toHaveLength(0);
  });
  it("rejects malformed scoring JSON", () => {
    const schema = estimateSchema("writing");
    expect(schema.safeParse({ band: 6.3, criteria: [], feedback: "x", corrected_sample: "y" }).success).toBe(false);
    const good = scoreHeuristic("writing", "Write at least 80 words.", "Cooking at school is useful. However, time is short. For example, many timetables are full. In conclusion, short weekly lessons are best for students.");
    expect(schema.safeParse(good).success).toBe(true);
  });
  it("report writer: digits from the model are rejected; code inserts numbers", () => {
    expect(validateTemplate("{{name}} came to 4 of 5 classes. {{homework_done}} {{homework_total}} {{next_focus}}")).toBe(false);
    expect(validateTemplate("{{name}} came to {{attendance_present}} of {{attendance_total}}. Homework {{homework_done}}/{{homework_total}}. Focus: {{next_focus}}. {{made_up}}")).toBe(false);
    const d: WeekData = { student_name: "Riya Shah", week_start: "2026-10-19", attendance_present: 4, attendance_total: 5, homework_done: 2, homework_total: 3, mocks: [{ title: "Mock 1 (writing)", band: 6.5, is_estimate: false }], target_band: 7, latest_band: 6.5, next_focus: "writing" };
    const t = templateFor(d);
    expect(validateTemplate(t)).toBe(true);
    const text = fill(t, d);
    expect(text).toContain("4 of 5");
    expect(text).toContain("2 of 3");
    expect(text).toContain("band 6.5");
    expect(text).not.toContain("{{");
  });
});

describe("rate limit", () => {
  it("blocks after the limit within the window", () => {
    resetRateLimits();
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 0).ok).toBe(true);
    expect(rateLimit("k", 3, 1000, 10).ok).toBe(false);
    expect(rateLimit("k", 3, 1000, 2000).ok).toBe(true);
  });
});

describe("seed data", () => {
  it("never ships answer keys inside public question shape", async () => {
    const { toPublic } = await import("@/lib/services/diagnostic");
    for (const q of buildSeed().questions) expect("answer_key" in toPublic(q)).toBe(false);
  });
});
