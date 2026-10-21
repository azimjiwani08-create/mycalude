import { z } from "zod";
import { route } from "@/lib/pipeline";
import { listBatchesWithSeats } from "@/lib/services/catalogue";
import { officeId } from "@/lib/schemas";

export const GET = route({
  schema: z.object({ office: officeId.optional(), course: z.string().max(40).optional() }),
  limit: { perIp: 120 },
  handler: async ({ input, db }) => {
    const [courses, batches, offices] = await Promise.all([
      db.select("courses", { active: true }),
      listBatchesWithSeats(db, { office_id: input.office, course_id: input.course, openOnly: true }),
      db.select("offices"),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    return { courses, offices, batches: batches.filter((b) => b.start_date >= today) };
  },
});
