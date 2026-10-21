import { route } from "@/lib/pipeline";

export const DELETE = route({
  roles: ["admin"],
  handler: async ({ db, params }) => ({ removed: await db.remove("content_entries", { id: params.id }) }),
});
