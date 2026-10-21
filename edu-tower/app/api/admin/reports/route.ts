import { z } from "zod";
import { route } from "@/lib/pipeline";
import { visibleOffices } from "@/lib/access";
import { generateWeeklyDrafts, listReportsForStaff } from "@/lib/services/reports";
import { isoDate } from "@/lib/schemas";
import { aiLive } from "@/lib/env";

export const GET = route({
  roles: ["admin", "counsellor", "teacher"],
  handler: async ({ db, user }) => ({ reports: await listReportsForStaff(db, user!) }),
});

/** Runs the weekly job now for the staff member's offices. */
export const POST = route({
  roles: ["admin", "counsellor", "teacher"],
  schema: z.object({ week_start: isoDate.optional() }),
  limit: { perUser: 4 },
  handler: async ({ input, db, user, live }) => generateWeeklyDrafts(db, { aiLive: live && aiLive(), weekStart: input.week_start, offices: visibleOffices(user!) }),
});
