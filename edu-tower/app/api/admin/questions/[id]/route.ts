import { z } from "zod";
import { route } from "@/lib/pipeline";
import { reviewQuestion } from "@/lib/services/practice";

export const POST = route({
  roles: ["admin", "teacher"],
  schema: z.object({ approve: z.boolean(), prompt: z.string().min(10).max(600).optional() }),
  handler: async ({ input, db, user, params }) => ({ question: await reviewQuestion(db, user!, params.id, input.approve, { prompt: input.prompt }) }),
});
