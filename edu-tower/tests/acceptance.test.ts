import { beforeEach, describe, expect, it } from "vitest";
import { MemoryDb } from "@/lib/db/memory";
import type { SessionUser } from "@/lib/types";
import { canSeeStudent, parentCanSee, isAdult } from "@/lib/access";
import { scoreDiagnostic } from "@/lib/services/diagnostic";
import { confirmBooking, createBooking, expireHolds, listBookingQueue } from "@/lib/services/bookings";
import { createSubmission, processSubmission, reviewSubmission, getSubmissionForViewer } from "@/lib/services/submissions";
import { approveAndSend, collectWeekData, generateWeeklyDrafts, weekStartOf } from "@/lib/services/reports";
import { listBatchesWithSeats } from "@/lib/services/catalogue";

let db: MemoryDb;

async function as(userId: string): Promise<SessionUser> {
  const [u] = await db.select("users", { id: userId });
  const [s] = await db.select("students", { user_id: userId });
  const [p] = await db.select("parents", { user_id: userId });
  return { ...u, student_id: s?.id ?? null, parent_id: p?.id ?? null };
}

beforeEach(() => {
  process.env.EDU_DEMO_MODE = "true";
  db = new MemoryDb();
});

describe("diagnostic → confirmed seat, nobody types twice", () => {
  it("carries the diagnostic and booking details into a new student record", async () => {
    const result = await scoreDiagnostic(
      db,
      null,
      {
        goal: "ielts_academic",
        answers: { "dq-r1": "Roofs may not carry the weight", "dq-r2": "Cleaner air", "dq-r3": "A structural check", "dq-l1": "Thursday at eleven", "dq-l2": "Their timetable", "dq-l3": "The coordinator is away" },
        writing: "I agree that children should learn to cook at school. Firstly, cooking teaches them about healthy food. Moreover, it is a practical skill for life. However, schools already have full timetables, so lessons should be short. In conclusion, I believe a weekly cooking class would help students.",
        speaking: "I like to visit Marine Drive in Mumbai because I can walk by the sea in the evening with my friends and relax after college.",
      },
      { aiLive: false },
    );
    expect(result.objective.reading).toEqual({ raw: 3, max: 3 });
    expect(result.objective.listening).toEqual({ raw: 2, max: 3 });
    expect(result.diagnostic.band_estimate).toBeGreaterThan(0);
    expect(result.diagnostic.suggested_course).toBe("ielts-academic");

    const booking = await createBooking(db, { batch_id: "b-mum-ielts-next", full_name: "Asha Rao", phone: "919900000001", diagnostic_id: result.diagnostic.id }, null);
    expect(booking.status).toBe("held");
    expect(Date.parse(booking.held_until) - Date.now()).toBeGreaterThan(47 * 3_600_000);

    const counsellor = await as("u-coun-mum");
    const confirmed = await confirmBooking(db, counsellor, booking.id);
    expect(confirmed.booking.status).toBe("confirmed");

    const [student] = await db.select("students", { id: confirmed.booking.student_id! });
    expect(student.full_name).toBe("Asha Rao");
    expect(student.phone).toBe("919900000001");
    expect(student.office_id).toBe("mumbai");
    const [diag] = await db.select("diagnostics", { id: result.diagnostic.id });
    expect(diag.student_id).toBe(student.id);
    expect(await db.select("enrolments", { student_id: student.id, batch_id: "b-mum-ielts-next" })).toHaveLength(1);
  });

  it("holds seats atomically and refuses a full batch", async () => {
    // b-mum-english has 2 seats and one live hold already.
    await createBooking(db, { batch_id: "b-mum-english", full_name: "One Person", phone: "919900000010", diagnostic_id: null }, null);
    await expect(createBooking(db, { batch_id: "b-mum-english", full_name: "Two Person", phone: "919900000011", diagnostic_id: null }, null)).rejects.toThrow(/filled up/);
    const [b] = await listBatchesWithSeats(db, { course_id: "english-foundation" });
    expect(b.seats_left).toBe(0);
  });

  it("does not take two seats for a double tap", async () => {
    const a = await createBooking(db, { batch_id: "b-mum-pte", full_name: "Same Person", phone: "919900000020", diagnostic_id: null }, null);
    const b = await createBooking(db, { batch_id: "b-mum-pte", full_name: "Same Person", phone: "919900000020", diagnostic_id: null }, null);
    expect(b.id).toBe(a.id);
  });

  it("releases holds after 48 hours", async () => {
    const later = new Date(Date.now() + 49 * 3_600_000);
    expect(await expireHolds(db, later)).toBe(3);
  });
});

describe("writing submission: marked, reviewed, released, both scores kept", () => {
  it("runs the marking pipeline", async () => {
    const riya = await as("u-st-riya");
    const sub = await createSubmission(db, riya, { kind: "mock", test_id: "t-mock-ac-1", question_id: "mq-w1", skill: "writing", body_text: "Working from home is common now. However, it has advantages and disadvantages. For example, people save time. In conclusion, I think it is positive overall." });
    expect(sub.status).toBe("queued");

    const marked = await processSubmission(db, sub.id, { aiLive: false });
    expect(marked?.status).toBe("awaiting_review");
    // Student cannot see the score until a teacher releases it.
    expect((await getSubmissionForViewer(db, sub.id)).score).toBeNull();

    const teacher = await as("u-teach-mum");
    const [aiScore] = await db.select("scores", { submission_id: sub.id });
    expect(aiScore.ai_estimate?.criteria).toHaveLength(4);
    const final = await reviewSubmission(db, teacher, sub.id, { final_band: 6.5, note: "Good structure", release: true });
    expect(final.final_band).toBe(6.5);
    expect(final.ai_band).toBe(aiScore.ai_band);
    expect(final.final_by).toBe("u-teach-mum");

    const view = await getSubmissionForViewer(db, sub.id);
    expect(view.submission.status).toBe("released");
    expect(view.score?.final_band).toBe(6.5);
    expect(view.score?.ai_band).toBe(aiScore.ai_band);
  });

  it("marks objective answers by code and releases them", async () => {
    const riya = await as("u-st-riya");
    const sub = await createSubmission(db, riya, { kind: "mock", test_id: "t-mock-ac-1", question_id: null, skill: "objective", answers: { "mq-r1": "Three-quarters", "mq-r2": "harvest early", "mq-l1": "Monday and Friday" } });
    await processSubmission(db, sub.id, { aiLive: false });
    const [score] = await db.select("scores", { submission_id: sub.id });
    expect(score.objective_raw).toBe(2);
    expect(score.objective_max).toBe(7);
  });

  it("stops a teacher from another office", async () => {
    const vadTeacher = await as("u-teach-vad");
    await expect(reviewSubmission(db, vadTeacher, "sub-meera-w", { final_band: 6, release: true })).rejects.toThrow(/another office/);
  });
});

describe("parent access needs consent", () => {
  it("allows a consented, parent-signed minor", async () => {
    const [riya] = await db.select("students", { id: "st-riya" });
    expect(isAdult(riya.date_of_birth)).toBe(false);
    expect(await parentCanSee(db, "pa-shah", riya)).toBe(true);
  });
  it("blocks an adult who has not agreed", async () => {
    const [arjun] = await db.select("students", { id: "st-arjun" });
    expect(await parentCanSee(db, "pa-patel", arjun)).toBe(false);
    expect(await canSeeStudent(db, await as("u-pa-patel"), "st-arjun")).toBe(false);
  });
  it("blocks a minor without the parent-signed form", async () => {
    const [kabir] = await db.select("students", { id: "st-kabir" });
    expect(await parentCanSee(db, "pa-desai", kabir)).toBe(false);
  });
  it("blocks again after the student revokes", async () => {
    await db.update("consents", { id: "c-1" }, { revoked_at: new Date().toISOString() });
    const [riya] = await db.select("students", { id: "st-riya" });
    expect(await parentCanSee(db, "pa-shah", riya)).toBe(false);
  });
  it("never lets a parent see another family's child", async () => {
    expect(await canSeeStudent(db, await as("u-pa-shah"), "st-meera")).toBe(false);
  });
});

describe("office isolation", () => {
  it("Mumbai staff cannot see Vadodara records, and the reverse", async () => {
    const mum = await as("u-coun-mum");
    const vad = await as("u-coun-vad");
    expect(await canSeeStudent(db, mum, "st-arjun")).toBe(false);
    expect(await canSeeStudent(db, vad, "st-riya")).toBe(false);
    expect(await canSeeStudent(db, mum, "st-riya")).toBe(true);
    expect((await listBookingQueue(db, mum)).every((b) => b.office_id === "mumbai")).toBe(true);
    expect((await listBookingQueue(db, vad)).every((b) => b.office_id === "vadodara")).toBe(true);
    await expect(confirmBooking(db, mum, "bk-3")).rejects.toThrow(/another office/);
  });
  it("admin sees both", async () => {
    const admin = await as("u-admin");
    expect(await canSeeStudent(db, admin, "st-arjun")).toBe(true);
    expect((await listBookingQueue(db, admin)).length).toBe(3);
  });
  it("a student sees only themself", async () => {
    const riya = await as("u-st-riya");
    expect(await canSeeStudent(db, riya, "st-riya")).toBe(true);
    expect(await canSeeStudent(db, riya, "st-meera")).toBe(false);
  });
});

describe("weekly report", () => {
  it("drafts from data, waits for approval, and respects consent on send", async () => {
    const week = weekStartOf();
    const { created } = await generateWeeklyDrafts(db, { aiLive: false, weekStart: week });
    expect(created).toBe(4);
    const [arjunReport] = await db.select("reports", { student_id: "st-arjun", week_start: week });
    expect(arjunReport.status).toBe("draft");
    const data = arjunReport.data;
    expect(arjunReport.body_text).toContain(`${data.attendance_present} of ${data.attendance_total}`);

    const vad = await as("u-coun-vad");
    const sent = await approveAndSend(db, vad, arjunReport.id);
    expect(sent.report.status).toBe("sent");
    expect(sent.report.sent_parent_at).toBeNull();
    expect(sent.delivery.parents[0]).toMatchObject({ sent: false });

    const [riyaReport] = await db.select("reports", { student_id: "st-riya", week_start: week });
    const riyaSent = await approveAndSend(db, await as("u-coun-mum"), riyaReport.id);
    expect(riyaSent.report.sent_parent_at).not.toBeNull();
  });

  it("collects numbers that match the records", async () => {
    const [riya] = await db.select("students", { id: "st-riya" });
    const d = await collectWeekData(db, riya, weekStartOf());
    expect(d.attendance_present).toBeLessThanOrEqual(d.attendance_total);
    expect(d.homework_done).toBeLessThanOrEqual(d.homework_total);
  });
});
