import { z } from "zod";
import { route } from "@/lib/pipeline";
import { addHomework, getClassRoster, markAttendance, setHomeworkStatus } from "@/lib/services/staff";
import { id } from "@/lib/schemas";

export const GET = route({
  roles: ["admin", "teacher", "counsellor"],
  handler: async ({ db, user, params }) => getClassRoster(db, user!, params.id),
});

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("attendance"), entries: z.array(z.object({ student_id: id, status: z.enum(["present", "absent", "late", "excused"]) })).max(80) }),
  z.object({ action: z.literal("add_homework"), title: z.string().min(3).max(140), due_at: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) }),
  z.object({ action: z.literal("homework_status"), homework_id: id, entries: z.array(z.object({ student_id: id, status: z.enum(["assigned", "submitted", "late", "missing"]) })).max(80) }),
]);

export const POST = route({
  roles: ["admin", "teacher"],
  schema: body,
  handler: async ({ input, db, user, params }) => {
    if (input.action === "attendance") return markAttendance(db, user!, params.id, input.entries);
    if (input.action === "add_homework") return { homework: await addHomework(db, user!, params.id, { title: input.title, due_at: new Date(input.due_at).toISOString() }) };
    return setHomeworkStatus(db, user!, input.homework_id, input.entries);
  },
});
