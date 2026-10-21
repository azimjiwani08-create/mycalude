import { z } from "zod";
import { route } from "@/lib/pipeline";
import { putFile } from "@/lib/storage";
import { exam, officeId } from "@/lib/schemas";

/** Upload and schedule a mock test (paper/audio file kept in private storage). */
export const GET = route({
  roles: ["admin", "teacher"],
  handler: async ({ db }) => ({ tests: await db.select("tests", { kind: "mock" }, { order: { column: "scheduled_at", ascending: false } }) }),
});

export const POST = route({
  roles: ["admin", "teacher"],
  schema: z.object({
    title: z.string().min(3).max(100),
    exam,
    duration_min: z.coerce.number().int().min(5).max(240),
    office_id: officeId.or(z.literal("")).transform((v) => v || null),
    scheduled_at: z.string().min(10).max(30),
    file: z.instanceof(File).optional(),
  }),
  maxBytes: 15 * 1024 * 1024,
  handler: async ({ input, db, user }) => {
    if (user!.role !== "admin" && input.office_id && input.office_id !== user!.office_id) input.office_id = user!.office_id;
    const file_path = input.file && input.file.size ? await putFile(`tests/${crypto.randomUUID()}-${input.file.name.replace(/[^\w.-]/g, "_")}`, input.file) : null;
    return { test: await db.insert("tests", { kind: "mock", exam: input.exam, title: input.title, duration_min: input.duration_min, office_id: input.office_id ?? user!.office_id, scheduled_at: new Date(input.scheduled_at).toISOString(), file_path }) };
  },
});
