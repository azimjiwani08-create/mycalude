import { route } from "@/lib/pipeline";
import { toPublic } from "@/lib/services/diagnostic";
import { latestBands } from "@/lib/services/reports";
import { weakestSkill } from "@/lib/marking";

/** Approved bank questions, weakest skill first. Answer keys never leave the server. */
export const GET = route({
  roles: ["student"],
  handler: async ({ db, user }) => {
    const weakest = weakestSkill(await latestBands(db, user!.student_id!));
    const bank = (await db.select("questions", { test_id: null, review_state: "approved" })).filter((q) => q.skill === "writing" || q.skill === "speaking");
    bank.sort((a, b) => Number(b.skill === weakest) - Number(a.skill === weakest));
    return { weakest, questions: bank.map(toPublic) };
  },
});
