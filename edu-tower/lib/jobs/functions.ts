import { inngest } from "./client";
import { serverDb } from "@/lib/db";
import { aiLive } from "@/lib/env";
import { processSubmission } from "@/lib/services/submissions";
import { generateWeeklyDrafts } from "@/lib/services/reports";
import { expireHolds } from "@/lib/services/bookings";

export const markSubmission = inngest.createFunction(
  { id: "mark-submission", retries: 2, concurrency: { limit: 5 } },
  { event: "edu/submission.queued" },
  async ({ event, step }) => step.run("mark", async () => (await processSubmission(serverDb(), event.data.submission_id, { aiLive: aiLive() }))?.status ?? "missing"),
);

// Sunday 6 pm IST: drafts wait for staff approval on Monday morning.
export const weeklyReports = inngest.createFunction(
  { id: "weekly-reports" },
  [{ cron: "TZ=Asia/Kolkata 0 18 * * 0" }, { event: "edu/report.generate" }],
  async ({ step }) => step.run("drafts", () => generateWeeklyDrafts(serverDb(), { aiLive: aiLive() })),
);

export const releaseExpiredHolds = inngest.createFunction(
  { id: "release-expired-holds" },
  { cron: "0 * * * *" },
  async ({ step }) => step.run("expire", () => expireHolds(serverDb())),
);

export const functions = [markSubmission, weeklyReports, releaseExpiredHolds];
