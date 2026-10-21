import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "edu-tower" });

export type JobEvent =
  | { name: "edu/submission.queued"; data: { submission_id: string } }
  | { name: "edu/report.generate"; data: { week_start?: string } };
