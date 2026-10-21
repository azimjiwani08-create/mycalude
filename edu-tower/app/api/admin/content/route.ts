import { z } from "zod";
import { route } from "@/lib/pipeline";
import { upsertContent } from "@/lib/services/staff";

export const GET = route({
  roles: ["admin", "counsellor", "teacher"],
  handler: async ({ db }) => ({ entries: await db.select("content_entries", {}, { order: { column: "kind" } }), courses: await db.select("courses") }),
});

const entry = z.object({
  type: z.literal("entry"),
  id: z.string().max(64).optional(),
  kind: z.enum(["faq", "course", "fee", "policy"]),
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
  tags: z.array(z.string().max(30)).max(20).default([]),
  approved: z.boolean().default(false),
});
const course = z.object({
  type: z.literal("course"),
  id: z.string().regex(/^[a-z0-9-]{3,40}$/),
  name: z.string().min(3).max(80),
  description: z.string().min(10).max(600),
  weeks: z.coerce.number().int().min(1).max(52),
  fee_inr: z.coerce.number().int().min(0).max(500_000),
  active: z.boolean(),
});

/** Courses, fees, FAQ and the helper's approved answers, no code change needed. */
export const POST = route({
  roles: ["admin"],
  schema: z.discriminatedUnion("type", [entry, course]),
  handler: async ({ input, db, user }) => {
    if (input.type === "entry") {
      const { type: _t, ...rest } = input;
      return { entry: await upsertContent(db, user!, rest) };
    }
    const { type: _t, ...c } = input;
    const [updated] = await db.update("courses", { id: c.id }, c);
    return { course: updated };
  },
});
