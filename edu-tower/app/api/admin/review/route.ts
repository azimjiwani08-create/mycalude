import { route } from "@/lib/pipeline";
import { listReviewQueue } from "@/lib/services/submissions";
import { signedUrl } from "@/lib/storage";

export const GET = route({
  roles: ["admin", "teacher"],
  handler: async ({ db, user }) => {
    const queue = await listReviewQueue(db, user!);
    return { queue: await Promise.all(queue.map(async (q) => ({ ...q, audio_url: q.submission.file_path ? await signedUrl(q.submission.file_path) : null }))) };
  },
});
