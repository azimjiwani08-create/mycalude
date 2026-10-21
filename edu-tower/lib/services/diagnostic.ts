import type { Db } from "@/lib/db";
import type { Diagnostic, Exam, PublicQuestion, Question, SessionUser, Skill } from "@/lib/types";
import { bandFromRatio, markObjective, overallBand, weakestSkill } from "@/lib/marking";
import { scoreHeuristic, scoreWithAi } from "@/lib/ai/scorer";
import { logAi } from "@/lib/ai/openai";
import { suggestCourse } from "./catalogue";
import type { CriterionScore } from "@/lib/types";
import { HttpError } from "@/lib/access";

export const DIAGNOSTIC_TEST_ID = "t-diagnostic";

/** Strips answer keys: the browser never sees them. */
export function toPublic(q: Question): PublicQuestion {
  const { answer_key: _k, reviewed_by: _r, ...rest } = q;
  return rest;
}

export async function getPublicTest(db: Db, testId: string) {
  const [test] = await db.select("tests", { id: testId });
  if (!test) throw new HttpError(404, "Test not found.");
  const questions = (await db.select("questions", { test_id: testId, review_state: "approved" })).map(toPublic);
  return { test, questions };
}

export interface DiagnosticInput {
  goal: Exam;
  answers: Record<string, string>;
  writing: string;
  speaking: string;
}

export interface DiagnosticResult {
  diagnostic: Diagnostic;
  objective: Record<"reading" | "listening", { raw: number; max: number }>;
  criteria: Record<"writing" | "speaking", CriterionScore[]>;
  feedback: Record<"writing" | "speaking", string>;
}

export async function scoreDiagnostic(db: Db, user: SessionUser | null, input: DiagnosticInput, opts: { aiLive: boolean }): Promise<DiagnosticResult> {
  const questions = await db.select("questions", { test_id: DIAGNOSTIC_TEST_ID });
  const bySkill = (s: Skill) => questions.filter((q) => q.skill === s);
  const reading = markObjective(bySkill("reading"), input.answers);
  const listening = markObjective(bySkill("listening"), input.answers);
  const wq = bySkill("writing")[0];
  const sq = bySkill("speaking")[0];

  const productive = async (skill: "writing" | "speaking", prompt: string, text: string) => {
    if (!text.trim()) return { band: 3.5, criteria: [{ name: "No response", band: 0, reason: "Nothing was submitted for this skill." }], feedback: "Try this section next time for a full picture." };
    if (opts.aiLive) {
      const r = await scoreWithAi(skill, prompt, text);
      if (r.ok) {
        await logAi(db, { user_id: user?.id ?? null, feature: "diagnostic", model: r.usage.model, input_tokens: r.usage.inTok, output_tokens: r.usage.outTok, cost_usd: r.usage.cost, question: null, answer: null });
        return r.estimate;
      }
    }
    return scoreHeuristic(skill, prompt, text);
  };
  const [w, s] = await Promise.all([productive("writing", wq?.prompt ?? "", input.writing), productive("speaking", sq?.prompt ?? "", input.speaking)]);

  const skill_bands: Record<Skill, number> = {
    reading: bandFromRatio(reading.raw, reading.max),
    listening: bandFromRatio(listening.raw, listening.max),
    writing: w.band,
    speaking: s.band,
  };
  const band_estimate = overallBand(skill_bands);
  const diagnostic = await db.insert("diagnostics", {
    student_id: user?.student_id ?? null,
    exam: input.goal,
    band_estimate,
    skill_bands,
    weakest_skill: weakestSkill(skill_bands),
    suggested_course: suggestCourse(input.goal, band_estimate),
  });
  return {
    diagnostic,
    objective: { reading: { raw: reading.raw, max: reading.max }, listening: { raw: listening.raw, max: listening.max } },
    criteria: { writing: w.criteria, speaking: s.criteria },
    feedback: { writing: w.feedback, speaking: s.feedback },
  };
}
