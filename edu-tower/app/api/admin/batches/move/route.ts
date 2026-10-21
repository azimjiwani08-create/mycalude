import { z } from "zod";
import { route } from "@/lib/pipeline";
import { moveStudent } from "@/lib/services/staff";
import { id } from "@/lib/schemas";

export const POST = route({
  roles: ["admin", "counsellor"],
  schema: z.object({ student_id: id, from_batch: id, to_batch: id }),
  handler: async ({ input, db, user }) => moveStudent(db, user!, input),
});
