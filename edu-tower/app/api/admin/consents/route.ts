import { z } from "zod";
import { route } from "@/lib/pipeline";
import { HttpError, assertOffice } from "@/lib/access";
import { putFile } from "@/lib/storage";
import { id } from "@/lib/schemas";

/** Staff record a parent-signed consent form for an under-18 student. */
export const POST = route({
  roles: ["admin", "counsellor"],
  schema: z.object({ student_id: id, parent_id: id, form: z.instanceof(File).optional() }),
  maxBytes: 5 * 1024 * 1024,
  handler: async ({ input, db, user }) => {
    const [student] = await db.select("students", { id: input.student_id });
    if (!student) throw new HttpError(404, "Student not found.");
    assertOffice(user!, student.office_id);
    const link = await db.select("parent_links", { student_id: student.id, parent_id: input.parent_id });
    if (!link.length) throw new HttpError(400, "That parent is not linked to this student.");
    if (input.form && input.form.type !== "application/pdf" && !input.form.type.startsWith("image/")) throw new HttpError(415, "Upload a PDF or photo of the signed form.");
    const evidence_path = input.form ? await putFile(`consents/${student.id}/${crypto.randomUUID()}`, input.form) : null;
    return { consent: await db.insert("consents", { student_id: student.id, parent_id: input.parent_id, kind: "parent_signed_minor", granted_by: user!.id, evidence_path }) };
  },
});
