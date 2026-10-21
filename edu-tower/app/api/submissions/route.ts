import { z } from "zod";
import { route } from "@/lib/pipeline";
import { createSubmission, MAX_AUDIO_BYTES } from "@/lib/services/submissions";
import { enqueue } from "@/lib/queue";
import { id } from "@/lib/schemas";

const schema = z.object({
  kind: z.enum(["practice", "mock"]),
  test_id: id.optional(),
  question_id: id,
  skill: z.enum(["writing", "speaking"]),
  body_text: z.string().max(12_000).optional(),
  audio: z.instanceof(File).optional(),
});

/** Writing or speaking practice; speaking arrives as an audio upload. */
export const POST = route({
  roles: ["student"],
  schema,
  maxBytes: MAX_AUDIO_BYTES + 64 * 1024,
  limit: { perUser: 10, windowMs: 10 * 60_000 },
  handler: async ({ input, db, user }) => {
    const sub = await createSubmission(db, user!, { kind: input.kind, test_id: input.test_id ?? null, question_id: input.question_id, skill: input.skill, body_text: input.body_text ?? null, audio: input.audio ?? null });
    await enqueue({ name: "edu/submission.queued", data: { submission_id: sub.id } });
    return { id: sub.id };
  },
});
