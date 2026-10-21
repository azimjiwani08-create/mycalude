import type { Db } from "@/lib/db";
import { HttpError, assertOffice, visibleOffices } from "@/lib/access";
import type { SessionUser, Submission, Score, AiEstimate } from "@/lib/types";
import { markObjective, objectiveBand } from "@/lib/marking";
import { scoreHeuristic, scoreWithAi } from "@/lib/ai/scorer";
import { logAi, transcribe, sttCost } from "@/lib/ai/openai";
import { deleteFile, getFile, putFile } from "@/lib/storage";
import { sendWhatsApp } from "@/lib/whatsapp";

export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-m4a", "audio/aac"];

export interface NewSubmission {
  kind: Submission["kind"];
  test_id: string | null;
  question_id: string | null;
  skill: Submission["skill"];
  body_text?: string | null;
  answers?: Record<string, string> | null;
  audio?: File | null;
}

/** C1. Save the raw file or text to private storage and queue it. */
export async function createSubmission(db: Db, user: SessionUser, input: NewSubmission): Promise<Submission> {
  if (!user.student_id) throw new HttpError(403, "Only students can submit work.");
  if (input.skill === "speaking" && !input.audio && !input.body_text) throw new HttpError(400, "Please record your answer first.");
  if ((input.skill === "writing") && !(input.body_text ?? "").trim()) throw new HttpError(400, "Please write your answer first.");

  let file_path: string | null = null;
  if (input.audio) {
    const type = input.audio.type.split(";")[0];
    if (!AUDIO_TYPES.includes(type)) throw new HttpError(415, "Please upload an audio recording.");
    if (input.audio.size > MAX_AUDIO_BYTES) throw new HttpError(413, "That recording is too long. Keep it under 3 minutes.");
    const ext = type.split("/")[1].replace("x-", "").replace("mpeg", "mp3");
    file_path = await putFile(`submissions/${user.student_id}/${crypto.randomUUID()}.${ext}`, input.audio);
  }

  return db.insert("submissions", {
    student_id: user.student_id,
    test_id: input.test_id,
    question_id: input.question_id,
    kind: input.kind,
    skill: input.skill,
    body_text: input.body_text?.slice(0, 12_000) ?? null,
    answers: input.answers ?? null,
    file_path,
    status: "queued",
  });
}

/**
 * C2–C8. The marking job. Idempotent: only queued submissions are processed.
 */
export async function processSubmission(db: Db, submissionId: string, opts: { aiLive: boolean }): Promise<Submission | null> {
  const [sub] = await db.select("submissions", { id: submissionId });
  if (!sub || sub.status !== "queued") return sub ?? null;
  await db.update("submissions", { id: sub.id }, { status: "processing", attempts: sub.attempts + 1 });

  const [student] = sub.student_id ? await db.select("students", { id: sub.student_id }) : [];
  const userId = student?.user_id ?? null;
  const score: Partial<Score> = { submission_id: sub.id, updated_at: new Date().toISOString() };
  let needsTeacher = false;

  // C3. Objective answers are marked by code.
  if (sub.answers && sub.test_id) {
    const questions = await db.select("questions", { test_id: sub.test_id });
    const objective = questions.filter((q) => q.answer_key !== null && (q.skill === "reading" || q.skill === "listening"));
    const m = markObjective(objective, sub.answers);
    score.objective_raw = m.raw;
    score.objective_max = m.max;
    score.ai_band = objectiveBand(m.raw, m.max);
    score.final_band = score.ai_band; // exact marking; no review needed
  }

  if (sub.skill === "writing" || sub.skill === "speaking") {
    let text = sub.body_text ?? "";

    // C2. Speaking audio is transcribed first.
    if (sub.skill === "speaking" && sub.file_path && opts.aiLive) {
      const audio = await getFile(sub.file_path);
      if (audio) {
        try {
          const t = await transcribe(audio);
          text = t.text;
          await logAi(db, { user_id: userId, feature: "transcribe", model: t.model, input_tokens: 0, output_tokens: 0, cost_usd: sttCost(t.seconds), question: null, answer: null });
        } catch (err) {
          console.error("[edu] transcription failed", err);
        }
      }
    }
    if (sub.skill === "speaking") await db.update("submissions", { id: sub.id }, { transcript: text || null });

    const [question] = sub.question_id ? await db.select("questions", { id: sub.question_id }) : [];
    const prompt = question?.prompt ?? "";

    if (!text.trim()) {
      needsTeacher = true;
    } else if (opts.aiLive) {
      // C4–C5. Rubric + strict JSON; validate; retry once; else needs_teacher.
      const r = await scoreWithAi(sub.skill, prompt, text);
      if (r.ok) {
        score.ai_estimate = r.estimate;
        score.ai_band = r.estimate.band;
        await logAi(db, { user_id: userId, feature: sub.kind === "practice" ? "feedback" : "diagnostic", model: r.usage.model, input_tokens: r.usage.inTok, output_tokens: r.usage.outTok, cost_usd: r.usage.cost, question: null, answer: null });
      } else {
        needsTeacher = true;
      }
    } else {
      const est = scoreHeuristic(sub.skill, prompt, text);
      score.ai_estimate = est;
      score.ai_band = est.band;
    }

    // Retention: raw audio is deleted after transcription and scoring unless the student keeps it.
    if (sub.file_path && !needsTeacher && student && !(await keepsAudio(db, student.id))) {
      await deleteFile(sub.file_path);
      await db.update("submissions", { id: sub.id }, { file_path: null });
    }
  }

  await db.upsert("scores", score, ["submission_id"]);

  // C6. Mock writing/speaking waits for a teacher; practice and objective-only release now.
  const productive = sub.skill === "writing" || sub.skill === "speaking";
  const status: Submission["status"] = needsTeacher ? "needs_teacher" : sub.kind === "mock" && productive ? "awaiting_review" : "released";
  const [updated] = await db.update("submissions", { id: sub.id }, { status, released_at: status === "released" ? new Date().toISOString() : null });
  if (status === "released" && student) await notifyRelease(student.phone, student.full_name);
  return updated;
}

async function keepsAudio(db: Db, studentId: string) {
  const c = await db.select("consents", { student_id: studentId, kind: "audio_retention" });
  return c.some((x) => !x.revoked_at);
}

async function notifyRelease(phone: string | null, name: string) {
  if (!phone) return;
  await sendWhatsApp(phone, `Hi ${name.split(" ")[0]}, your Edu Tower result is ready. Open your student portal to see your score and feedback.`);
}

export async function listReviewQueue(db: Db, user: SessionUser) {
  const students = await db.select("students", { office_id: visibleOffices(user) });
  const ids = students.map((s) => s.id);
  if (!ids.length) return [];
  const subs = await db.select("submissions", { student_id: ids, status: ["awaiting_review", "needs_teacher"] }, { order: { column: "created_at" } });
  const scores = await db.select("scores", { submission_id: subs.map((s) => s.id) });
  const qs = await db.select("questions", { id: subs.map((s) => s.question_id).filter((x): x is string => !!x) });
  return subs.map((s) => ({
    submission: s,
    student: students.find((st) => st.id === s.student_id)!,
    score: scores.find((sc) => sc.submission_id === s.id) ?? null,
    question: qs.find((q) => q.id === s.question_id) ?? null,
  }));
}

/** C7. Teacher reviews and may override. Final and AI scores are both kept. */
export async function reviewSubmission(db: Db, user: SessionUser, submissionId: string, input: { final_band: number; note?: string | null; release: boolean }) {
  const [sub] = await db.select("submissions", { id: submissionId });
  if (!sub?.student_id) throw new HttpError(404, "Submission not found.");
  const [student] = await db.select("students", { id: sub.student_id });
  assertOffice(user, student.office_id);
  const [existing] = await db.select("scores", { submission_id: sub.id });
  await db.upsert(
    "scores",
    { ...(existing ?? { ai_estimate: null, ai_band: null, objective_raw: null, objective_max: null }), submission_id: sub.id, final_band: input.final_band, final_by: user.id, final_note: input.note ?? null, updated_at: new Date().toISOString() },
    ["submission_id"],
  );
  if (input.release) {
    await db.update("submissions", { id: sub.id }, { status: "released", released_at: new Date().toISOString() });
    await notifyRelease(student.phone, student.full_name); // C8
  }
  const [score] = await db.select("scores", { submission_id: sub.id });
  return score;
}

/** What a student may see: AI estimates only once released, labelled as such. */
export async function getSubmissionForViewer(db: Db, submissionId: string) {
  const [sub] = await db.select("submissions", { id: submissionId });
  if (!sub) throw new HttpError(404, "Not found.");
  const [score] = await db.select("scores", { submission_id: sub.id });
  const visible = sub.status === "released";
  return {
    submission: { id: sub.id, kind: sub.kind, skill: sub.skill, status: sub.status, created_at: sub.created_at, released_at: sub.released_at, transcript: sub.transcript, student_id: sub.student_id },
    score: visible && score ? publicScore(score) : null,
  };
}

export function publicScore(s: Score): { ai_estimate: AiEstimate | null; ai_band: number | null; final_band: number | null; teacher_reviewed: boolean; final_note: string | null; objective_raw: number | null; objective_max: number | null } {
  return { ai_estimate: s.ai_estimate, ai_band: s.ai_band, final_band: s.final_band, teacher_reviewed: !!s.final_by, final_note: s.final_note, objective_raw: s.objective_raw, objective_max: s.objective_max };
}
