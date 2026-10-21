import { z } from "zod";
import { route } from "@/lib/pipeline";
import { DIAGNOSTIC_TEST_ID, getPublicTest, scoreDiagnostic } from "@/lib/services/diagnostic";
import { assertAiQuota } from "@/lib/ai/openai";
import { answers, exam } from "@/lib/schemas";
import { aiLive } from "@/lib/env";

export const GET = route({
  limit: { perIp: 60 },
  handler: async ({ db }) => getPublicTest(db, DIAGNOSTIC_TEST_ID),
});

export const POST = route({
  schema: z.object({
    goal: exam,
    answers,
    writing: z.string().max(5000).default(""),
    speaking: z.string().max(5000).default(""),
  }),
  maxBytes: 24 * 1024,
  limit: { perUser: 3, perIp: 5, windowMs: 10 * 60_000 },
  handler: async ({ input, db, user, ip, live }) => {
    await assertAiQuota(db, user?.id ?? null, ip);
    return scoreDiagnostic(db, user, input, { aiLive: live && aiLive() });
  },
});
