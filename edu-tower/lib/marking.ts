import type { Question, Skill } from "@/lib/types";

/** IELTS rounding: average to the nearest half band (x.25 → x.5, x.75 → x+1). */
export function roundBand(x: number): number {
  return Math.min(9, Math.max(0, Math.round(x * 2) / 2));
}

/** Objective answers are marked by code; no model involved. */
export function markObjective(questions: Pick<Question, "id" | "answer_key">[], answers: Record<string, string>) {
  let raw = 0;
  const perQuestion: Record<string, boolean> = {};
  const marked = questions.filter((q) => q.answer_key !== null);
  for (const q of marked) {
    const given = (answers[q.id] ?? "").trim().toLowerCase();
    const ok = given !== "" && given === (q.answer_key ?? "").trim().toLowerCase();
    perQuestion[q.id] = ok;
    if (ok) raw++;
  }
  return { raw, max: marked.length, perQuestion };
}

/**
 * Converts a short-test raw score to a band estimate. Full mocks with 40
 * items should use the official conversion table instead (bandFrom40).
 */
export function bandFromRatio(raw: number, max: number): number {
  if (max === 0) return 0;
  return roundBand(3 + 6 * (raw / max));
}

// Academic reading/listening 40-item conversion (published approximate table).
const TABLE_40: [number, number][] = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 0]];
export function bandFrom40(raw: number): number {
  return TABLE_40.find(([min]) => raw >= min)?.[1] ?? 0;
}

export function objectiveBand(raw: number, max: number) {
  return max === 40 ? bandFrom40(raw) : bandFromRatio(raw, max);
}

export function overallBand(skills: Partial<Record<Skill, number>>): number {
  const vals = Object.values(skills).filter((v): v is number => typeof v === "number");
  return vals.length ? roundBand(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

export function weakestSkill(skills: Partial<Record<Skill, number>>): Skill {
  const order: Skill[] = ["writing", "speaking", "reading", "listening"]; // tie-break: productive skills first
  return order.reduce((worst, s) => ((skills[s] ?? 9) < (skills[worst] ?? 9) ? s : worst), order[0]);
}
