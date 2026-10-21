import { z } from "zod";
import type { Db } from "@/lib/db";
import { HttpError } from "@/lib/access";
import type { Question, SessionUser, Skill } from "@/lib/types";
import { chatJson, estimateCost, logAi } from "@/lib/ai/openai";
import { latestBands } from "./reports";
import { weakestSkill } from "@/lib/marking";

const generated = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(10).max(600),
        passage: z.string().max(1500).nullable().optional(),
        options: z.array(z.string().min(1).max(160)).length(4).nullable().optional(),
        answer: z.string().max(160).nullable().optional(),
      }),
    )
    .min(1)
    .max(5),
});

const DEMO_POOL: Record<Skill, { prompt: string; passage?: string; options?: string[]; answer?: string }[]> = {
  writing: [
    { prompt: "Some people believe exams are the best way to judge students. Others prefer coursework. Discuss both views and give your opinion (250 words)." },
    { prompt: "Write a paragraph (120 words) describing a change in your city over the last ten years and its effect on people." },
    { prompt: "Write a letter to a friend recommending a course you have taken. Explain what you learned and why it was useful." },
  ],
  speaking: [
    { prompt: "Describe a time you helped someone. Say who it was, what you did, and how you felt afterwards." },
    { prompt: "Talk about a website or app you use every day. Explain what you use it for and why you like it." },
  ],
  reading: [
    { passage: "Many cities now offer bicycle-sharing schemes. Users unlock a bike with a phone app and leave it at any official stand. Planners say the schemes cut short car trips, but they only work where there are safe cycle lanes.", prompt: "According to the passage, bicycle-sharing schemes only work when…", options: ["bikes are free", "there are safe cycle lanes", "cars are banned", "stands are close together"], answer: "there are safe cycle lanes" },
  ],
  listening: [
    { passage: "Welcome to the museum. The café on the ground floor closes at four today, an hour earlier than usual. Guided tours start every thirty minutes from the main entrance.", prompt: "What time does the café close today?", options: ["Three", "Four", "Five", "Six"], answer: "Four" },
  ],
};

/**
 * Practice generator: extra questions for the student's weakest skill,
 * tagged by skill and level, saved as pending_review. Nothing enters the
 * shared bank until a teacher approves it.
 */
export async function generatePractice(db: Db, user: SessionUser, input: { student_id?: string; skill?: Skill; level?: string; count: number }, opts: { aiLive: boolean }): Promise<Question[]> {
  let skill = input.skill;
  if (!skill && input.student_id) skill = weakestSkill(await latestBands(db, input.student_id));
  skill ??= "writing";
  const level = input.level ?? "band 6";
  const count = Math.min(5, Math.max(1, input.count));

  let items: { prompt: string; passage?: string | null; options?: string[] | null; answer?: string | null }[];
  if (opts.aiLive) {
    const objective = skill === "reading" || skill === "listening";
    const r = await chatJson(
      [
        `Write ${count} original IELTS-style ${skill} practice questions at ${level}.`,
        objective ? "Each needs a short passage (60–120 words; for listening, a script to be read aloud), a question, exactly 4 options and the correct answer copied exactly from the options." : "Each needs only a task prompt; set options and answer to null.",
        "No real people, brands or copyrighted text. Return JSON: {\"questions\": [{\"prompt\", \"passage\", \"options\", \"answer\"}]}",
      ].join("\n"),
      `Skill: ${skill}. Level: ${level}.`,
    );
    const parsed = generated.safeParse(r?.json);
    if (!parsed.success) throw new HttpError(502, "The generator returned something unusable. Please try again.");
    items = parsed.data.questions.filter((q) => !objective || (q.options && q.answer && q.options.includes(q.answer)));
    if (r) await logAi(db, { user_id: user.id, feature: "practice", model: r.model, input_tokens: r.inTok, output_tokens: r.outTok, cost_usd: estimateCost(r.model, r.inTok, r.outTok), question: null, answer: null });
  } else {
    items = DEMO_POOL[skill].slice(0, count);
  }

  const saved: Question[] = [];
  for (const q of items) {
    saved.push(
      await db.insert("questions", {
        test_id: null,
        skill,
        level,
        prompt: q.prompt,
        passage: q.passage ?? null,
        options: q.options ?? null,
        answer_key: q.answer ?? null,
        source: "ai_generated",
        review_state: "pending_review",
        reviewed_by: null,
      }),
    );
  }
  return saved;
}

export async function reviewQuestion(db: Db, user: SessionUser, id: string, approve: boolean, edits?: { prompt?: string }) {
  const [q] = await db.select("questions", { id });
  if (!q) throw new HttpError(404, "Question not found.");
  const [updated] = await db.update("questions", { id }, { review_state: approve ? "approved" : "rejected", reviewed_by: user.id, ...(edits?.prompt ? { prompt: edits.prompt } : {}) });
  return updated;
}
