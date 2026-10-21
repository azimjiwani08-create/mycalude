import { route } from "@/lib/pipeline";
import { HttpError } from "@/lib/access";
import { resetDemoDb } from "@/lib/db";

export const POST = route({
  roles: ["admin"],
  handler: async ({ live }) => {
    if (live) throw new HttpError(404, "Not found.");
    resetDemoDb();
    return { ok: true };
  },
});
