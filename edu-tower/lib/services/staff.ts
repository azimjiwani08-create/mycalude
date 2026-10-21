import type { Db } from "@/lib/db";
import { HttpError, assertOffice, visibleOffices } from "@/lib/access";
import type { AttendanceStatus, Batch, ContentEntry, HomeworkState, OfficeId, SessionUser } from "@/lib/types";

export async function createBatch(db: Db, user: SessionUser, input: Omit<Batch, "id" | "status" | "end_date"> & { end_date?: string | null }) {
  assertOffice(user, input.office_id);
  const [course] = await db.select("courses", { id: input.course_id });
  if (!course) throw new HttpError(400, "Unknown course.");
  return db.insert("batches", { ...input, end_date: input.end_date ?? null, status: "open" });
}

export async function updateBatch(db: Db, user: SessionUser, id: string, patch: Partial<Pick<Batch, "seats" | "start_date" | "end_date" | "schedule" | "status" | "teacher_id">>) {
  const [batch] = await db.select("batches", { id });
  if (!batch) throw new HttpError(404, "Batch not found.");
  assertOffice(user, batch.office_id);
  if (patch.seats !== undefined) {
    const enrolled = (await db.select("enrolments", { batch_id: id })).length;
    if (patch.seats < enrolled) throw new HttpError(409, `${enrolled} students are already enrolled; seats cannot go below that.`);
  }
  const [updated] = await db.update("batches", { id }, patch);
  return updated;
}

export async function moveStudent(db: Db, user: SessionUser, input: { student_id: string; from_batch: string; to_batch: string }) {
  const [from] = await db.select("batches", { id: input.from_batch });
  const [to] = await db.select("batches", { id: input.to_batch });
  if (!from || !to) throw new HttpError(404, "Batch not found.");
  assertOffice(user, from.office_id);
  assertOffice(user, to.office_id);
  if (to.status !== "open") throw new HttpError(409, "The target batch is not open.");
  const enrolled = (await db.select("enrolments", { batch_id: to.id })).length;
  if (enrolled >= to.seats) throw new HttpError(409, "The target batch is full.");
  const n = await db.remove("enrolments", { student_id: input.student_id, batch_id: from.id });
  if (!n) throw new HttpError(404, "That student is not in the original batch.");
  await db.insert("enrolments", { student_id: input.student_id, batch_id: to.id });
  if (from.office_id !== to.office_id) await db.update("students", { id: input.student_id }, { office_id: to.office_id });
  return { ok: true };
}

async function classInOffice(db: Db, user: SessionUser, classId: string) {
  const [cls] = await db.select("classes", { id: classId });
  if (!cls) throw new HttpError(404, "Class not found.");
  const [batch] = await db.select("batches", { id: cls.batch_id });
  assertOffice(user, batch.office_id);
  return { cls, batch };
}

export async function getClassRoster(db: Db, user: SessionUser, classId: string) {
  const { cls, batch } = await classInOffice(db, user, classId);
  const enrol = await db.select("enrolments", { batch_id: batch.id });
  const students = enrol.length ? await db.select("students", { id: enrol.map((e) => e.student_id) }) : [];
  const attendance = await db.select("attendance", { class_id: classId });
  const homework = await db.select("homework", { class_id: classId });
  const hwStatus = homework.length ? await db.select("homework_status", { homework_id: homework.map((h) => h.id) }) : [];
  return { cls, batch, students, attendance, homework, hwStatus };
}

export async function markAttendance(db: Db, user: SessionUser, classId: string, entries: { student_id: string; status: AttendanceStatus }[]) {
  const { batch } = await classInOffice(db, user, classId);
  const enrolled = new Set((await db.select("enrolments", { batch_id: batch.id })).map((e) => e.student_id));
  for (const e of entries) {
    if (!enrolled.has(e.student_id)) throw new HttpError(400, "Student is not in this batch.");
    await db.upsert("attendance", { class_id: classId, student_id: e.student_id, status: e.status, marked_by: user.id, marked_at: new Date().toISOString() }, ["class_id", "student_id"]);
  }
  return { saved: entries.length };
}

export async function addHomework(db: Db, user: SessionUser, classId: string, input: { title: string; due_at: string }) {
  const { batch } = await classInOffice(db, user, classId);
  const hw = await db.insert("homework", { class_id: classId, title: input.title, due_at: input.due_at });
  const enrol = await db.select("enrolments", { batch_id: batch.id });
  for (const e of enrol) await db.insert("homework_status", { homework_id: hw.id, student_id: e.student_id, status: "assigned" });
  return hw;
}

export async function setHomeworkStatus(db: Db, user: SessionUser, homeworkId: string, entries: { student_id: string; status: HomeworkState }[]) {
  const [hw] = await db.select("homework", { id: homeworkId });
  if (!hw) throw new HttpError(404, "Homework not found.");
  await classInOffice(db, user, hw.class_id);
  for (const e of entries) await db.upsert("homework_status", { homework_id: homeworkId, student_id: e.student_id, status: e.status }, ["homework_id", "student_id"]);
  return { saved: entries.length };
}

export async function listClassesForStaff(db: Db, user: SessionUser, office?: OfficeId) {
  const offices = office ? [office].filter((o) => visibleOffices(user).includes(o)) : visibleOffices(user);
  const batches = await db.select("batches", { office_id: offices });
  if (!batches.length) return [];
  const classes = await db.select("classes", { batch_id: batches.map((b) => b.id) }, { order: { column: "starts_at", ascending: false } });
  return classes.map((c) => ({ ...c, batch: batches.find((b) => b.id === c.batch_id)! }));
}

export async function upsertContent(db: Db, user: SessionUser, input: Partial<ContentEntry> & Pick<ContentEntry, "kind" | "title" | "body">) {
  const row = { ...input, tags: input.tags ?? [], approved: input.approved ?? false, updated_by: user.id, updated_at: new Date().toISOString() };
  if (input.id) {
    const [u] = await db.update("content_entries", { id: input.id }, row);
    if (!u) throw new HttpError(404, "Entry not found.");
    return u;
  }
  return db.insert("content_entries", row);
}
