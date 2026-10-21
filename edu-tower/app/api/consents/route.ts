import { z } from "zod";
import { route } from "@/lib/pipeline";
import { HttpError } from "@/lib/access";

/**
 * Students grant or revoke parent sharing and audio retention themselves.
 * The parent-signed minor consent is recorded by staff (admin route) from a
 * signed form, never self-declared.
 */
export const POST = route({
  roles: ["student"],
  schema: z.object({ action: z.enum(["grant", "revoke"]), kind: z.enum(["parent_share", "audio_retention"]) }),
  handler: async ({ input, db, user }) => {
    const studentId = user!.student_id;
    if (!studentId) throw new HttpError(403, "No student record.");
    const links = await db.select("parent_links", { student_id: studentId });
    if (input.kind === "parent_share" && !links.length) throw new HttpError(400, "No parent is linked to your account yet.");
    const existing = (await db.select("consents", { student_id: studentId, kind: input.kind })).filter((c) => !c.revoked_at);
    if (input.action === "revoke") {
      await db.update("consents", { id: existing.map((c) => c.id) }, { revoked_at: new Date().toISOString() });
      return { ok: true };
    }
    if (input.kind === "audio_retention") {
      if (!existing.length) await db.insert("consents", { student_id: studentId, parent_id: null, kind: "audio_retention", granted_by: user!.id });
    } else {
      for (const l of links) {
        if (!existing.some((c) => c.parent_id === l.parent_id)) await db.insert("consents", { student_id: studentId, parent_id: l.parent_id, kind: "parent_share", granted_by: user!.id });
      }
    }
    return { ok: true };
  },
});
