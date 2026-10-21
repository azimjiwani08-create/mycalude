import { route } from "@/lib/pipeline";
import { assertCanSeeStudent, HttpError } from "@/lib/access";
import { getSubmissionForViewer } from "@/lib/services/submissions";

export const GET = route({
  roles: ["student", "parent", "teacher", "counsellor", "admin"],
  limit: { perUser: 120 },
  handler: async ({ db, user, params }) => {
    const view = await getSubmissionForViewer(db, params.id);
    if (!view.submission.student_id) throw new HttpError(404, "Not found.");
    await assertCanSeeStudent(db, user, view.submission.student_id);
    return view;
  },
});
