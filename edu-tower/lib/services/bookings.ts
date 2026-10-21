import type { Db } from "@/lib/db";
import { HttpError, assertOffice, visibleOffices } from "@/lib/access";
import type { Booking, SessionUser } from "@/lib/types";
import { sendWhatsApp, chatLink } from "@/lib/whatsapp";

export const HOLD_HOURS = 48;

export async function createBooking(db: Db, input: { batch_id: string; full_name: string; phone: string; diagnostic_id: string | null }, user: SessionUser | null) {
  const phone = input.phone.replace(/\D/g, "");
  // One live hold per phone per batch: double-taps don't eat two seats.
  const existing = (await db.select("bookings", { batch_id: input.batch_id, phone, status: "held" })).find((b) => Date.parse(b.held_until) > Date.now());
  if (existing) return existing;
  try {
    return await db.reserveSeat({ batch_id: input.batch_id, full_name: input.full_name.trim(), phone, student_id: user?.student_id ?? null, diagnostic_id: input.diagnostic_id });
  } catch (err) {
    const m = (err as Error).message;
    if (m === "batch_full") throw new HttpError(409, "Sorry, that batch just filled up. Please pick another date.", "batch_full");
    if (m === "batch_not_open") throw new HttpError(409, "That batch is no longer taking bookings.", "batch_not_open");
    throw err;
  }
}

export async function listBookingQueue(db: Db, user: SessionUser, status: Booking["status"] = "held") {
  await expireHolds(db);
  return db.select("bookings", { office_id: visibleOffices(user), status }, { order: { column: "held_until" } });
}

/** Releases seats whose 48-hour hold has passed. Runs hourly and before reads. */
export async function expireHolds(db: Db, now = new Date()) {
  const held = await db.select("bookings", { status: "held" }, { lt: { column: "held_until", value: now.toISOString() } });
  if (!held.length) return 0;
  await db.update("bookings", { id: held.map((b) => b.id) }, { status: "expired" });
  return held.length;
}

/**
 * One tap from the counsellor: confirms the seat, creates the student record
 * from what the student already typed (and links the diagnostic), enrols
 * them, and sends the WhatsApp confirmation. Nobody retypes anything.
 */
export async function confirmBooking(db: Db, user: SessionUser, bookingId: string) {
  const [booking] = await db.select("bookings", { id: bookingId });
  if (!booking) throw new HttpError(404, "Booking not found.");
  assertOffice(user, booking.office_id);
  if (booking.status === "confirmed") return { booking, alreadyConfirmed: true as const };
  if (booking.status !== "held") throw new HttpError(409, `This booking is ${booking.status}.`);
  if (Date.parse(booking.held_until) <= Date.now()) {
    await db.update("bookings", { id: booking.id }, { status: "expired" });
    throw new HttpError(409, "The 48-hour hold has expired. Ask the student to book again.");
  }

  const [batch] = await db.select("batches", { id: booking.batch_id });
  const [course] = batch ? await db.select("courses", { id: batch.course_id }) : [];
  const [diag] = booking.diagnostic_id ? await db.select("diagnostics", { id: booking.diagnostic_id }) : [];

  let studentId = booking.student_id;
  if (!studentId) {
    const [byPhone] = await db.select("students", { phone: booking.phone });
    studentId =
      byPhone?.id ??
      (
        await db.insert("students", {
          office_id: booking.office_id,
          full_name: booking.full_name,
          phone: booking.phone,
          date_of_birth: null,
          target_exam: course?.exam ?? diag?.exam ?? null,
          target_band: diag ? Math.min(9, diag.band_estimate + 1) : null,
          user_id: null,
        })
      ).id;
  }
  if (diag && !diag.student_id) await db.update("diagnostics", { id: diag.id }, { student_id: studentId });
  const already = await db.select("enrolments", { student_id: studentId, batch_id: booking.batch_id });
  if (!already.length) await db.insert("enrolments", { student_id: studentId, batch_id: booking.batch_id });

  const [updated] = await db.update("bookings", { id: booking.id }, { status: "confirmed", student_id: studentId, confirmed_by: user.id, confirmed_at: new Date().toISOString() });

  const message = `Hi ${booking.full_name.split(" ")[0]}, your seat in ${course?.name ?? "your course"} (${batch?.schedule ?? ""}, starting ${batch?.start_date ?? ""}) at Edu Tower ${booking.office_id === "mumbai" ? "Mumbai" : "Vadodara"} is confirmed. Reply here with any questions.`;
  const sent = await sendWhatsApp(booking.phone, message);
  return { booking: updated, alreadyConfirmed: false as const, whatsapp: sent.status, chat: chatLink(booking.phone, message) };
}

export async function cancelBooking(db: Db, user: SessionUser, bookingId: string) {
  const [booking] = await db.select("bookings", { id: bookingId });
  if (!booking) throw new HttpError(404, "Booking not found.");
  assertOffice(user, booking.office_id);
  const [updated] = await db.update("bookings", { id: bookingId }, { status: "cancelled" });
  return updated;
}
