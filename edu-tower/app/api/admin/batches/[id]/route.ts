import { z } from "zod";
import { route } from "@/lib/pipeline";
import { updateBatch } from "@/lib/services/staff";
import { isoDate } from "@/lib/schemas";

export const PATCH = route({
  roles: ["admin", "counsellor"],
  schema: z.object({ seats: z.coerce.number().int().min(1).max(60).optional(), start_date: isoDate.optional(), end_date: isoDate.nullable().optional(), schedule: z.string().min(3).max(80).optional(), status: z.enum(["open", "closed", "completed"]).optional() }),
  handler: async ({ input, db, user, params }) => ({ batch: await updateBatch(db, user!, params.id, input) }),
});
