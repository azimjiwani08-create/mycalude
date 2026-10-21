import { z } from "zod";
import { route } from "@/lib/pipeline";
import { HttpError } from "@/lib/access";
import { setSession } from "@/lib/session";
import { id } from "@/lib/schemas";

/** Demo only: sign in as a sample user to try each role. Disabled when live. */
export const POST = route({
  schema: z.object({ user_id: id }),
  limit: { perIp: 30 },
  handler: async ({ input, db, live }) => {
    if (live) throw new HttpError(404, "Not found.");
    const [user] = await db.select("users", { id: input.user_id });
    if (!user) throw new HttpError(404, "Unknown demo user.");
    await setSession(user.id);
    return { ok: true, role: user.role };
  },
});
