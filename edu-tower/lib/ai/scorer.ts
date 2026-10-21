import "server-only";
import type { AiEstimate } from "@/lib/types";
import { roundBand } from "@/lib/marking";
import { RUBRIC, estimateSchema, systemPrompt, type ProductiveSkill } from "./rubric";
import { chatJson, estimateCost } from "./openai";

export type ScoreResult =
  | { ok: true; estimate: AiEstimate; usage: { model: string; inTok: number; outTok: number; cost: number } }
  | { ok: false; reason: "invalid_json" };

/**
 * Scores writing or speaking against the rubric. Validates the model's JSON;
 * retries once; after that the caller marks the submission needs_teacher.
 */
export async function scoreWithAi(skill: ProductiveSkill, prompt: string, response: string): Promise<ScoreResult> {
  const schema = estimateSchema(skill);
  const user = `Task:\n${prompt}\n\nCandidate response:\n"""\n${response.slice(0, 8000)}\n"""`;
  let inTok = 0;
  let outTok = 0;
  let model = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await chatJson(systemPrompt(skill), user);
    if (!r) continue;
    inTok += r.inTok;
    outTok += r.outTok;
    model = r.model;
    const parsed = schema.safeParse(r.json);
    if (parsed.success) {
      const est = parsed.data;
      // The overall band is recomputed by code, never trusted from the model.
      est.band = roundBand(est.criteria.reduce((a, c) => a + c.band, 0) / est.criteria.length);
      return { ok: true, estimate: est, usage: { model, inTok, outTok, cost: estimateCost(model, inTok, outTok) } };
    }
  }
  return { ok: false, reason: "invalid_json" };
}

/**
 * Demo-mode scorer: a transparent heuristic (length, variety, sentence
 * control, linking) so the whole flow works without an API key. Output has
 * the same shape and is labelled an estimate like the real one.
 */
export function scoreHeuristic(skill: ProductiveSkill, prompt: string, response: string): AiEstimate {
  const text = response.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const minWords = /250/.test(prompt) ? 250 : /150/.test(prompt) ? 150 : skill === "speaking" ? 120 : 80;
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ""))).size;
  const variety = wc ? unique / wc : 0;
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const avgLen = sentences.length ? wc / sentences.length : wc;
  const linkers = (text.match(/\b(however|therefore|moreover|in addition|for example|for instance|although|whereas|firstly|secondly|finally|in conclusion|on the other hand|because|while)\b/gi) ?? []).length;
  const slips = (text.match(/(\bi\b(?!')|\s{2,}|\b(\w+) \2\b|\bis many\b|\bthere is many\b)/g) ?? []).length + sentences.filter((s) => /^[a-z]/.test(s)).length;

  const clamp = (n: number) => roundBand(Math.min(8, Math.max(3.5, n)));
  const lengthBand = clamp(4 + 3 * Math.min(1, wc / minWords));
  const cohesion = clamp(4.5 + Math.min(2.5, linkers * 0.5) + (sentences.length >= 4 ? 0.5 : 0));
  const lexical = clamp(3.5 + variety * 5);
  const grammar = clamp(7 - Math.min(3, slips * 0.5) - (avgLen > 35 ? 0.5 : 0) + (avgLen > 12 ? 0.5 : 0));
  const values = [lengthBand, cohesion, lexical, grammar];
  const reasons = [
    wc < minWords ? `About ${wc} words — below the ${minWords} expected, so ideas are not fully developed.` : "Covers the task with enough length to develop ideas.",
    linkers >= 3 ? "Uses a range of linking words to guide the reader." : "Add linking words (however, for example, as a result) to connect ideas.",
    variety > 0.65 ? "Good variety of vocabulary with little repetition." : "Some words repeat; try synonyms and topic-specific vocabulary.",
    slips > 2 ? "Several basic errors (capitals, agreement, repetition) lower accuracy." : "Generally accurate with a mix of sentence lengths.",
  ];
  const criteria = RUBRIC[skill].map((c, i) => ({ name: c.name, band: values[i], reason: skill === "speaking" && i === 3 ? "Pronunciation can't be judged from a transcript in demo mode; teacher to confirm." : reasons[i] }));
  const corrected = sentences
    .map((s) => s.replace(/\bi\b/g, "I").replace(/\bthere is many\b/gi, "there are many").replace(/\bis many\b/gi, "are many").replace(/\s{2,}/g, " "))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(". ");
  return {
    band: roundBand(values.reduce((a, b) => a + b, 0) / values.length),
    criteria,
    feedback:
      (wc < minWords ? `Aim for at least ${minWords} words so each idea has an example. ` : "") +
      (linkers < 3 ? "Link your ideas more clearly. " : "") +
      "Plan one main idea per paragraph, support it with a specific example, and finish with a clear conclusion.",
    corrected_sample: corrected ? corrected + "." : "(No response to correct.)",
  };
}
