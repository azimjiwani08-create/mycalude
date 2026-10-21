import { z } from "zod";
import { route } from "@/lib/pipeline";
import { HttpError } from "@/lib/access";
import { createSubmission, MAX_AUDIO_BYTES } from "@/lib/services/submissions";
import { enqueue } from "@/lib/queue";
import { answers, id } from "@/lib/schemas";

const schema = z.object({
  test_id: id,
  answers: z.string().max(20_000).transform((s, ctx) => {
    try {
      return answers.parse(JSON.parse(s));
    } catch {
      ctx.addIssue({ code: "custom", message: "bad answers" });
      return z.NEVER;
    }
  }),
  writing: z.string().max(12_000).default(""),
  speaking_text: z.string().max(6_000).default(""),
  audio: z.instanceof(File).optional(),
});

/** A full mock: objective answers + writing + speaking, each its own submission. */
export const POST = route({
  roles: ["student"],
  schema,
  maxBytes: MAX_AUDIO_BYTES + 64 * 1024,
  limit: { perUser: 4, windowMs: 60 * 60_000 },
  handler: async ({ input, db, user }) => {
    const [test] = await db.select("tests", { id: input.test_id, kind: "mock" });
    if (!test) throw new HttpError(404, "Mock test not found.");
    const qs = await db.select("questions", { test_id: test.id });
    const wq = qs.find((q) => q.skill === "writing");
    const sq = qs.find((q) => q.skill === "speaking");

    const ids: string[] = [];
    const objective = await createSubmission(db, user!, { kind: "mock", test_id: test.id, question_id: null, skill: "objective", answers: input.answers });
    ids.push(objective.id);
    if (wq && input.writing.trim()) ids.push((await createSubmission(db, user!, { kind: "mock", test_id: test.id, question_id: wq.id, skill: "writing", body_text: input.writing })).id);
    if (sq && (input.audio || input.speaking_text.trim())) ids.push((await createSubmission(db, user!, { kind: "mock", test_id: test.id, question_id: sq.id, skill: "speaking", body_text: input.speaking_text || null, audio: input.audio ?? null })).id);

    for (const sid of ids) await enqueue({ name: "edu/submission.queued", data: { submission_id: sid } });
    return { submissions: ids };
  },
});
