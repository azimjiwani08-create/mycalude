import type { ReactNode } from "react";

/** Every AI score is labelled "estimate" until a teacher confirms it. */
export function Band({ value, estimate, label }: { value: number | null | undefined; estimate: boolean; label?: string }) {
  if (value === null || value === undefined) return <span className="pill">No score yet</span>;
  return (
    <span className={`band ${estimate ? "estimate" : ""}`} title={estimate ? "AI estimate — a teacher may adjust it" : "Confirmed by your teacher"}>
      {Number(value).toFixed(1)}
      <small>{label ?? (estimate ? "estimate" : "confirmed")}</small>
    </span>
  );
}

export function Progress({ value, max, blue }: { value: number; max: number; blue?: boolean }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`progress ${blue ? "blue" : ""}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted">{children}</p>;
}

export const SKILL_LABEL: Record<string, string> = { reading: "Reading", writing: "Writing", listening: "Listening", speaking: "Speaking", objective: "Reading & Listening" };

export function statusPill(status: string) {
  const map: Record<string, [string, string]> = {
    queued: ["amber", "Marking…"],
    processing: ["amber", "Marking…"],
    awaiting_review: ["amber", "Teacher reviewing"],
    needs_teacher: ["amber", "Teacher marking"],
    released: ["green", "Ready"],
    held: ["amber", "Seat held"],
    confirmed: ["green", "Confirmed"],
    expired: ["red", "Expired"],
    cancelled: ["red", "Cancelled"],
    draft: ["amber", "Draft"],
    approved: ["blue", "Approved"],
    sent: ["green", "Sent"],
    present: ["green", "Present"],
    late: ["amber", "Late"],
    absent: ["red", "Absent"],
    excused: ["blue", "Excused"],
    submitted: ["green", "Done"],
    missing: ["red", "Missing"],
    assigned: ["blue", "To do"],
    open: ["green", "Open"],
    closed: ["red", "Closed"],
    completed: ["blue", "Completed"],
  };
  const [tone, text] = map[status] ?? ["", status];
  return <span className={`pill ${tone}`}>{text}</span>;
}

export function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(iso).toLocaleDateString("en-IN", opts);
}
export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
