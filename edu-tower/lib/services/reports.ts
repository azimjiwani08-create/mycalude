import type { Db } from "@/lib/db";
import { HttpError, assertOffice, parentCanSee, visibleOffices } from "@/lib/access";
import type { Report, SessionUser, Skill, Student, WeekData } from "@/lib/types";
import { writeReport } from "@/lib/ai/report-writer";
import { logAi } from "@/lib/ai/openai";
import { weakestSkill } from "@/lib/marking";
import { sendWhatsApp } from "@/lib/whatsapp";

/** Monday 00:00 (server local time) of the week containing `d`. */
export function weekStartOf(d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return toDateOnly(x);
}
function toDateOnly(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** D1. Collects one student's week into structured numbers. */
export async function collectWeekData(db: Db, student: Student, weekStart: string): Promise<WeekData> {
  const from = new Date(`${weekStart}T00:00:00`);
  const to = new Date(from.getTime() + 7 * 86_400_000);
  const inWeek = (iso: string) => {
    const t = Date.parse(iso);
    return t >= from.getTime() && t < to.getTime();
  };

  const enrol = await db.select("enrolments", { student_id: student.id });
  const classes = enrol.length ? (await db.select("classes", { batch_id: enrol.map((e) => e.batch_id) })).filter((c) => inWeek(c.starts_at) && Date.parse(c.starts_at) < Date.now()) : [];
  const att = classes.length ? await db.select("attendance", { student_id: student.id, class_id: classes.map((c) => c.id) }) : [];
  const attended = att.filter((a) => a.status === "present" || a.status === "late").length;

  const hw = classes.length ? await db.select("homework", { class_id: classes.map((c) => c.id) }) : [];
  const hwStatus = hw.length ? await db.select("homework_status", { student_id: student.id, homework_id: hw.map((h) => h.id) }) : [];
  const dueHw = hwStatus.filter((h) => h.status !== "assigned");

  const subs = (await db.select("submissions", { student_id: student.id, status: "released" })).filter((s) => s.released_at && inWeek(s.released_at) && s.kind === "mock");
  const scores = subs.length ? await db.select("scores", { submission_id: subs.map((s) => s.id) }) : [];
  const tests = subs.length ? await db.select("tests", { id: subs.map((s) => s.test_id).filter((x): x is string => !!x) }) : [];
  const mocks = subs
    .map((s) => {
      const sc = scores.find((x) => x.submission_id === s.id);
      const band = sc?.final_band ?? sc?.ai_band;
      if (band == null) return null;
      const title = `${tests.find((t) => t.id === s.test_id)?.title ?? "Mock"} (${s.skill === "objective" ? "reading & listening" : s.skill})`;
      return { title, band: Number(band), is_estimate: sc?.final_band == null };
    })
    .filter((m): m is NonNullable<typeof m> => !!m);

  const latest = await latestBands(db, student.id);
  const values = Object.values(latest);
  return {
    student_name: student.full_name,
    week_start: weekStart,
    attendance_present: attended,
    attendance_total: att.length,
    homework_done: dueHw.filter((h) => h.status === "submitted" || h.status === "late").length,
    homework_total: dueHw.length,
    mocks,
    target_band: student.target_band,
    latest_band: values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 2) / 2 : null,
    next_focus: values.length ? weakestSkill(latest) : "writing",
  };
}

/** Most recent released band per skill, from mocks and the diagnostic. */
export async function latestBands(db: Db, studentId: string): Promise<Partial<Record<Skill, number>>> {
  const out: Partial<Record<Skill, number>> = {};
  const [diag] = await db.select("diagnostics", { student_id: studentId }, { order: { column: "created_at", ascending: false }, limit: 1 });
  if (diag) Object.assign(out, diag.skill_bands);
  const subs = await db.select("submissions", { student_id: studentId, status: "released" }, { order: { column: "released_at" } });
  const scores = subs.length ? await db.select("scores", { submission_id: subs.map((s) => s.id) }) : [];
  for (const s of subs) {
    const sc = scores.find((x) => x.submission_id === s.id);
    const band = sc?.final_band ?? sc?.ai_band;
    if (band == null) continue;
    if (s.skill === "objective") {
      out.reading = Number(band);
      out.listening = Number(band);
    } else out[s.skill] = Number(band);
  }
  return out;
}

/** D1–D3. Scheduled weekly: every enrolled student gets a draft. */
export async function generateWeeklyDrafts(db: Db, opts: { aiLive: boolean; weekStart?: string; offices?: string[] }) {
  const weekStart = opts.weekStart ?? weekStartOf();
  const enrol = await db.select("enrolments");
  const ids = [...new Set(enrol.map((e) => e.student_id))];
  const students = ids.length ? await db.select("students", { id: ids }) : [];
  let created = 0;
  for (const st of students) {
    if (opts.offices && !opts.offices.includes(st.office_id)) continue;
    const [existing] = await db.select("reports", { student_id: st.id, week_start: weekStart });
    if (existing && existing.status !== "draft") continue; // never overwrite an approved report
    const data = await collectWeekData(db, st, weekStart);
    const { text, usage } = await writeReport(data, { aiLive: opts.aiLive });
    if (usage) await logAi(db, { user_id: null, feature: "report", model: usage.model, input_tokens: usage.inTok, output_tokens: usage.outTok, cost_usd: usage.cost, question: null, answer: null });
    await db.upsert("reports", { student_id: st.id, week_start: weekStart, data, body_text: text, status: "draft" }, ["student_id", "week_start"]);
    created++;
  }
  return { weekStart, created };
}

export async function listReportsForStaff(db: Db, user: SessionUser) {
  const students = await db.select("students", { office_id: visibleOffices(user) });
  if (!students.length) return [];
  const reports = await db.select("reports", { student_id: students.map((s) => s.id) }, { order: { column: "week_start", ascending: false } });
  return reports.map((r) => ({ report: r, student: students.find((s) => s.id === r.student_id)! }));
}

/**
 * D3–D5. Staff approve (optionally editing the wording). Then it goes to the
 * student, and to each linked parent only when consent allows.
 */
export async function approveAndSend(db: Db, user: SessionUser, reportId: string, editedText?: string) {
  const [report] = await db.select("reports", { id: reportId });
  if (!report) throw new HttpError(404, "Report not found.");
  const [student] = await db.select("students", { id: report.student_id });
  assertOffice(user, student.office_id);
  const now = new Date().toISOString();
  const body = editedText?.trim() || report.body_text;
  await db.update("reports", { id: report.id }, { body_text: body, status: "approved", approved_by: user.id, approved_at: now });

  const delivery: { student: string; parents: { name: string; sent: boolean; reason?: string }[] } = { student: "portal", parents: [] };
  if (student.phone) {
    const r = await sendWhatsApp(student.phone, `Your Edu Tower weekly report (week of ${report.week_start}):\n\n${body}`);
    delivery.student = r.status === "sent" ? "whatsapp+portal" : "portal";
  }

  let parentSent = false;
  const links = await db.select("parent_links", { student_id: student.id });
  for (const link of links) {
    const [parent] = await db.select("parents", { id: link.parent_id });
    if (!parent) continue;
    if (!(await parentCanSee(db, parent.id, student))) {
      delivery.parents.push({ name: parent.full_name, sent: false, reason: "no consent on record" });
      continue;
    }
    if (parent.phone) await sendWhatsApp(parent.phone, `Edu Tower weekly report for ${student.full_name.split(" ")[0]} (week of ${report.week_start}):\n\n${body}`);
    delivery.parents.push({ name: parent.full_name, sent: true });
    parentSent = true;
  }

  const [updated] = await db.update("reports", { id: report.id }, { status: "sent", sent_student_at: now, sent_parent_at: parentSent ? now : null });
  return { report: updated as Report, delivery };
}
