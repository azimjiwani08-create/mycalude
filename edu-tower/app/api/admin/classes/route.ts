import { route } from "@/lib/pipeline";
import { listClassesForStaff } from "@/lib/services/staff";

export const GET = route({
  roles: ["admin", "teacher", "counsellor"],
  handler: async ({ db, user }) => ({ classes: await listClassesForStaff(db, user!) }),
});
