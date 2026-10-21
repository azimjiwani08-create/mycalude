import "server-only";
import type { WeekData } from "@/lib/types";
import { chatJson, estimateCost } from "./openai";

/**
 * The report writer only words what the data says. The model writes with
 * placeholders; code inserts every number and name. Output containing any
 * digit, or an unknown placeholder, is rejected.
 */
export const PLACEHOLDERS = ["name", "attendance_present", "attendance_total", "homework_done", "homework_total", "mock_summary", "latest_band", "target_band", "band_gap", "next_focus"] as const;
type Placeholder = (typeof PLACEHOLDERS)[number];

export function placeholderValues(d: WeekData): Record<Placeholder, string> {
  const gap = d.latest_band !== null && d.target_band !== null ? Math.max(0, d.target_band - d.latest_band) : null;
  return {
    name: d.student_name.split(" ")[0],
    attendance_present: String(d.attendance_present),
    attendance_total: String(d.attendance_total),
    homework_done: String(d.homework_done),
    homework_total: String(d.homework_total),
    mock_summary: d.mocks.length ? d.mocks.map((m) => `${m.title}: band ${m.band.toFixed(1)}${m.is_estimate ? " (estimate)" : ""}`).join("; ") : "no mock test this week",
    latest_band: d.latest_band !== null ? d.latest_band.toFixed(1) : "not yet measured",
    target_band: d.target_band !== null ? d.target_band.toFixed(1) : "not set",
    band_gap: gap !== null ? gap.toFixed(1) : "unknown",
    next_focus: d.next_focus,
  };
}

export function validateTemplate(t: string): boolean {
  if (/\d/.test(t)) return false;
  const used = [...t.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  if (used.some((p) => !(PLACEHOLDERS as readonly string[]).includes(p))) return false;
  return ["attendance_present", "attendance_total", "homework_done", "homework_total", "next_focus"].every((p) => used.includes(p));
}

export function fill(template: string, d: WeekData): string {
  const v = placeholderValues(d);
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: Placeholder) => v[k] ?? "");
}

/** Deterministic wording, used in demo mode and if the model output fails validation. */
export function templateFor(d: WeekData): string {
  const rate = d.attendance_total ? d.attendance_present / d.attendance_total : 1;
  const hwRate = d.homework_total ? d.homework_done / d.homework_total : 1;
  const opener = d.attendance_total === 0 ? "{{name}} had no classes marked this week." : rate >= 0.9 ? "{{name}} had a strong week and came to {{attendance_present}} of {{attendance_total}} classes." : rate >= 0.7 ? "{{name}} attended {{attendance_present}} of {{attendance_total}} classes this week." : "{{name}} attended {{attendance_present}} of {{attendance_total}} classes this week; regular attendance will help progress.";
  const hw = d.homework_total === 0 ? " No homework was due." : hwRate >= 0.9 ? " Homework was on track: {{homework_done}} of {{homework_total}} done." : " Homework: {{homework_done}} of {{homework_total}} done, so catching up on the missing pieces is a priority.";
  const mocks = d.mocks.length ? " Mock results: {{mock_summary}}." : "";
  const gap = d.latest_band !== null && d.target_band !== null ? " Latest band {{latest_band}} against a target of {{target_band}}." : "";
  return `${opener}${hw}${mocks}${gap} Next focus: {{next_focus}}.`;
}

export async function writeReport(d: WeekData, opts: { aiLive: boolean }): Promise<{ text: string; usage?: { model: string; inTok: number; outTok: number; cost: number } }> {
  if (!opts.aiLive) return { text: fill(templateFor(d), d) };
  const system = [
    "You write short weekly progress notes for students of an English test-prep school, read by the student and sometimes a parent.",
    "Write 3–5 warm, plain sentences. Never write any digit or number word for a quantity. Instead use these placeholders exactly where a value belongs:",
    PLACEHOLDERS.map((p) => `{{${p}}}`).join(", "),
    "You MUST include {{attendance_present}}, {{attendance_total}}, {{homework_done}}, {{homework_total}} and {{next_focus}}.",
    "Describe only what the data shows. Do not invent events, praise for things not in the data, or advice beyond the next focus.",
    'Return JSON: {"template": string}',
  ].join("\n");
  const shape = { attendance_ratio: d.attendance_total ? d.attendance_present / d.attendance_total : null, homework_ratio: d.homework_total ? d.homework_done / d.homework_total : null, mock_count: d.mocks.length, has_band_gap: d.latest_band !== null && d.target_band !== null && d.target_band > d.latest_band, next_focus: d.next_focus };
  let inTok = 0, outTok = 0, model = "";
  for (let i = 0; i < 2; i++) {
    const r = await chatJson(system, `Qualitative shape of this week (for tone only):\n${JSON.stringify(shape)}`);
    if (!r) continue;
    inTok += r.inTok; outTok += r.outTok; model = r.model;
    const t = (r.json as { template?: unknown })?.template;
    if (typeof t === "string" && validateTemplate(t)) {
      return { text: fill(t, d), usage: { model, inTok, outTok, cost: estimateCost(model, inTok, outTok) } };
    }
  }
  return { text: fill(templateFor(d), d), usage: model ? { model, inTok, outTok, cost: estimateCost(model, inTok, outTok) } : undefined };
}
