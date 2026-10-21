import { z } from "zod";
import { route } from "@/lib/pipeline";
import { approveAndSend } from "@/lib/services/reports";

export const POST = route({
  roles: ["admin", "counsellor", "teacher"],
  schema: z.object({ body_text: z.string().max(3000).optional() }),
  handler: async ({ input, db, user, params }) => approveAndSend(db, user!, params.id, input.body_text),
});
