import type { Db } from "@/lib/db";
import type { BatchWithSeats, OfficeId } from "@/lib/types";

export async function listBatchesWithSeats(db: Db, filter: { office_id?: OfficeId | OfficeId[]; course_id?: string; openOnly?: boolean } = {}): Promise<BatchWithSeats[]> {
  const batches = await db.select("batches", { office_id: filter.office_id, course_id: filter.course_id, status: filter.openOnly ? "open" : undefined }, { order: { column: "start_date" } });
  if (!batches.length) return [];
  const ids = batches.map((b) => b.id);
  const [enrolments, holds] = await Promise.all([
    db.select("enrolments", { batch_id: ids }),
    db.select("bookings", { batch_id: ids, status: "held" }),
  ]);
  const now = Date.now();
  return batches.map((b) => {
    const taken = enrolments.filter((e) => e.batch_id === b.id).length + holds.filter((h) => h.batch_id === b.id && Date.parse(h.held_until) > now).length;
    return { ...b, seats_taken: taken, seats_left: Math.max(0, b.seats - taken) };
  });
}

/** Suggests a course from the student's goal and diagnostic band. */
export function suggestCourse(goal: string, band: number): string {
  if (band < 5) return "english-foundation";
  const map: Record<string, string> = {
    ielts_academic: "ielts-academic",
    ielts_general: "ielts-general",
    ielts_ukvi: "ielts-ukvi",
    pte: "pte-academic",
    celpip: "celpip-general",
    english: "english-foundation",
    coaching: "coaching-1to1",
  };
  return map[goal] ?? "ielts-academic";
}
