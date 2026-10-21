import { z } from "zod";
import { route } from "@/lib/pipeline";
import { askHelper } from "@/lib/ai/helper";
import { assertAiQuota } from "@/lib/ai/openai";
import { officeId } from "@/lib/schemas";
import { aiLive } from "@/lib/env";

export const POST = route({
  schema: z.object({ question: z.string().trim().min(3).max(500), office: officeId.optional() }),
  maxBytes: 4 * 1024,
  limit: { perUser: 10, perIp: 15 },
  handler: async ({ input, user, db, ip, live }) => {
    await assertAiQuota(db, user?.id ?? null, ip);
    return askHelper({ db, user, question: input.question, office: input.office ?? null, aiLive: live && aiLive() });
  },
});
