import "server-only";
import { env, isLive, aiLive } from "@/lib/env";
import { demoDb } from "@/lib/db";
import { inngest, type JobEvent } from "@/lib/jobs/client";

/**
 * Hands work to the background queue. Live: Inngest (retries, concurrency,
 * schedules). Demo or no queue key: runs inline against the sample store so
 * the flow can be clicked through end to end.
 */
export async function enqueue(event: JobEvent): Promise<"queued" | "ran_inline"> {
  if (isLive() && env.inngestEventKey()) {
    await inngest.send(event);
    return "queued";
  }
  const db = isLive() ? (await import("@/lib/db")).serverDb() : demoDb();
  if (event.name === "edu/submission.queued") {
    const { processSubmission } = await import("@/lib/services/submissions");
    await processSubmission(db, event.data.submission_id, { aiLive: aiLive() });
  } else if (event.name === "edu/report.generate") {
    const { generateWeeklyDrafts } = await import("@/lib/services/reports");
    await generateWeeklyDrafts(db, { aiLive: aiLive(), weekStart: event.data.week_start });
  }
  return "ran_inline";
}
