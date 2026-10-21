import { route } from "@/lib/pipeline";
import { clearSession } from "@/lib/session";

export const POST = route({
  handler: async () => {
    await clearSession();
    return { ok: true };
  },
});
