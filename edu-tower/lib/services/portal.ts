import type { Db } from "@/lib/db";
import { HttpError } from "@/lib/access";
import { latestBands } from "./reports";
import { publicScore } from "./submissions";

export async function getPortal(db: Db, studentId: string) {
  const [student] = await db.select("students", { id: studentId });
  if (!student) throw new HttpError(404, "Student not found.");
  const enrol = await db.select("enrolments", { student_id: studentId });
  const batches = enrol.length ? await db.select("batches", { id: enrol.map((e) => e.batch_id) }) : [];
  const courses = batches.length ? await db.select("courses", { id: batches.map((b) => b.course_id) }) : [];
  const classes = batches.length ? await db.select("classes", { batch_id: batches.map((b) => b.id) }, { order: { column: "starts_at" } }) : [];

  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(startToday.getTime() + 86_400_000);
  const today = classes.filter((c) => { const t = Date.parse(c.starts_at); return t >= startToday.getTime() && t < endToday.getTime(); });

  const attendance = classes.length ? await db.select("attendance", { student_id: studentId, class_id: classes.map((c) => c.id) }) : [];
  const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;

  const homework = classes.length ? await db.select("homework", { class_id: classes.map((c) => c.id) }, { order: { column: "due_at", ascending: false } }) : [];
  const hwStatus = homework.length ? await db.select("homework_status", { student_id: studentId, homework_id: homework.map((h) => h.id) }) : [];

  const subs = await db.select("submissions", { student_id: studentId }, { order: { column: "created_at", ascending: false } });
  const scores = subs.length ? await db.select("scores", { submission_id: subs.map((s) => s.id) }) : [];
  const tests = await db.select("tests");
  const results = subs.map((s) => {
    const sc = scores.find((x) => x.submission_id === s.id);
    return {
      id: s.id,
      kind: s.kind,
      skill: s.skill,
      status: s.status,
      test: tests.find((t) => t.id === s.test_id)?.title ?? "Practice",
      created_at: s.created_at,
      score: s.status === "released" && sc ? publicScore(sc) : null,
    };
  });

  const bands = await latestBands(db, studentId);
  const vals = Object.values(bands);
  const current = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2 : null;
  const reports = (await db.select("reports", { student_id: studentId }, { order: { column: "week_start", ascending: false } })).filter((r) => r.status !== "draft");
  const consents = await db.select("consents", { student_id: studentId });
  const parents = await db.select("parent_links", { student_id: studentId });

  return {
    student,
    batches: batches.map((b) => ({ ...b, course: courses.find((c) => c.id === b.course_id) })),
    today,
    upcoming: classes.filter((c) => Date.parse(c.starts_at) >= endToday.getTime()).slice(0, 3),
    attendance: { present, total: attendance.length, recent: attendance.slice(-10).map((a) => ({ ...a, class: classes.find((c) => c.id === a.class_id) })) },
    homework: homework.map((h) => ({ ...h, status: hwStatus.find((s) => s.homework_id === h.id)?.status ?? "assigned" })),
    results,
    bands,
    current_band: current,
    target_band: student.target_band,
    reports,
    consents: consents.filter((c) => !c.revoked_at),
    has_parent: parents.length > 0,
  };
}
