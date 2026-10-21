import { z } from "zod";
import { route } from "@/lib/pipeline";
import { HttpError, assertCanSeeStudent } from "@/lib/access";
import { getFile } from "@/lib/storage";

/** Demo-mode stand-in for signed URLs. Live mode uses Supabase signed URLs. */
export const GET = route({
  roles: ["student", "teacher", "counsellor", "admin"],
  schema: z.object({ path: z.string().regex(/^submissions\/[\w-]+\/[\w-]+\.\w+$/) }),
  handler: async ({ input, db, user, live }) => {
    if (live) throw new HttpError(404, "Not found.");
    const studentId = input.path.split("/")[1];
    await assertCanSeeStudent(db, user, studentId);
    const f = await getFile(input.path);
    if (!f) throw new HttpError(404, "File not found.");
    return new Response(f, { headers: { "Content-Type": f.type, "Cache-Control": "private, no-store" } });
  },
});
