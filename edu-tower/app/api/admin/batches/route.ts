import { z } from "zod";
import { route } from "@/lib/pipeline";
import { visibleOffices } from "@/lib/access";
import { listBatchesWithSeats } from "@/lib/services/catalogue";
import { createBatch } from "@/lib/services/staff";
import { id, isoDate, officeId } from "@/lib/schemas";

export const GET = route({
  roles: ["admin", "counsellor", "teacher"],
  handler: async ({ db, user }) => {
    const batches = await listBatchesWithSeats(db, { office_id: visibleOffices(user!) });
    const enrol = batches.length ? await db.select("enrolments", { batch_id: batches.map((b) => b.id) }) : [];
    const students = enrol.length ? await db.select("students", { id: enrol.map((e) => e.student_id) }) : [];
    return {
      batches: batches.map((b) => ({ ...b, students: enrol.filter((e) => e.batch_id === b.id).map((e) => students.find((s) => s.id === e.student_id)!).filter(Boolean) })),
      courses: await db.select("courses"),
    };
  },
});

export const POST = route({
  roles: ["admin", "counsellor"],
  schema: z.object({ course_id: id, office_id: officeId, start_date: isoDate, end_date: isoDate.nullable().optional(), schedule: z.string().min(3).max(80), seats: z.coerce.number().int().min(1).max(60), teacher_id: id.nullable().default(null) }),
  handler: async ({ input, db, user }) => ({ batch: await createBatch(db, user!, input) }),
});
