import { route } from "@/lib/pipeline";

/** Weekly usage review: calls, tokens and estimated cost by feature. */
export const GET = route({
  roles: ["admin"],
  handler: async ({ db }) => {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const logs = await db.select("ai_logs", {}, { gte: { column: "created_at", value: since }, order: { column: "created_at", ascending: false } });
    const byFeature: Record<string, { calls: number; tokens: number; cost: number }> = {};
    for (const l of logs) {
      const f = (byFeature[l.feature] ??= { calls: 0, tokens: 0, cost: 0 });
      f.calls++;
      f.tokens += l.input_tokens + l.output_tokens;
      f.cost += Number(l.cost_usd);
    }
    return { since, byFeature, recent: logs.slice(0, 30) };
  },
});
