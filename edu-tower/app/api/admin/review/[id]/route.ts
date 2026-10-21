import { z } from "zod";
import { route } from "@/lib/pipeline";
import { reviewSubmission } from "@/lib/services/submissions";
import { band } from "@/lib/schemas";

export const POST = route({
  roles: ["admin", "teacher"],
  schema: z.object({ final_band: band, note: z.string().max(500).nullable().optional(), release: z.boolean().default(true) }),
  handler: async ({ input, db, user, params }) => ({ score: await reviewSubmission(db, user!, params.id, input) }),
});
