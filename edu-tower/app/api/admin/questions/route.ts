import { z } from "zod";
import { route } from "@/lib/pipeline";
import { generatePractice } from "@/lib/services/practice";
import { assertAiQuota } from "@/lib/ai/openai";
import { id, skill } from "@/lib/schemas";
import { aiLive } from "@/lib/env";

export const GET = route({
  roles: ["admin", "teacher"],
  handler: async ({ db }) => ({
    pending: await db.select("questions", { review_state: "pending_review" }),
    bank: (await db.select("questions", { test_id: null, review_state: "approved" })).map(({ answer_key, ...q }) => ({ ...q, has_key: !!answer_key })),
  }),
});

export const POST = route({
  roles: ["admin", "teacher"],
  schema: z.object({ skill: skill.optional(), student_id: id.optional(), level: z.string().max(20).optional(), count: z.coerce.number().int().min(1).max(5).default(3) }),
  limit: { perUser: 5 },
  handler: async ({ input, db, user, ip, live }) => {
    await assertAiQuota(db, user!.id, ip);
    return { created: await generatePractice(db, user!, input, { aiLive: live && aiLive() }) };
  },
});
