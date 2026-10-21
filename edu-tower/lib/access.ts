import type { Db } from "@/lib/db";
import type { OfficeId, Role, SessionUser, Student } from "@/lib/types";

/**
 * Code-level mirror of the Postgres RLS policies (supabase/migrations/0002_rls.sql).
 * Demo mode relies on these alone; live mode has both walls.
 */
export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const STAFF: Role[] = ["admin", "counsellor", "teacher"];

export function isStaff(u: SessionUser | null): u is SessionUser {
  return !!u && STAFF.includes(u.role);
}

export function requireRole(u: SessionUser | null, roles: Role[]): SessionUser {
  if (!u) throw new HttpError(401, "Please log in.");
  if (!roles.includes(u.role)) throw new HttpError(403, "You do not have access to this.");
  return u;
}

/** Admin sees all offices; other staff only their own. */
export function canStaffOffice(u: SessionUser, office: OfficeId): boolean {
  if (u.role === "admin") return true;
  return (u.role === "counsellor" || u.role === "teacher") && u.office_id === office;
}

export function assertOffice(u: SessionUser, office: OfficeId) {
  if (!canStaffOffice(u, office)) throw new HttpError(403, "That record belongs to another office.");
}

/** Offices whose records this staff member may list. */
export function visibleOffices(u: SessionUser): OfficeId[] {
  if (u.role === "admin") return ["mumbai", "vadodara"];
  return u.office_id ? [u.office_id] : [];
}

export function isAdult(dob: string | null, today = new Date()): boolean {
  if (!dob) return false; // unknown age is treated as under 18
  const d = new Date(dob);
  const eighteen = new Date(d.getFullYear() + 18, d.getMonth(), d.getDate());
  return eighteen <= today;
}

/**
 * Parent access needs: a parent link, an active parent_share consent, and —
 * for a student under 18 — an active parent-signed consent.
 */
export async function parentCanSee(db: Db, parentId: string, student: Student): Promise<boolean> {
  const links = await db.select("parent_links", { parent_id: parentId, student_id: student.id });
  if (!links.length) return false;
  const consents = (await db.select("consents", { student_id: student.id, parent_id: parentId })).filter((c) => !c.revoked_at);
  if (!consents.some((c) => c.kind === "parent_share")) return false;
  if (isAdult(student.date_of_birth)) return true;
  return consents.some((c) => c.kind === "parent_signed_minor");
}

export async function canSeeStudent(db: Db, u: SessionUser | null, studentId: string): Promise<boolean> {
  if (!u) return false;
  const [student] = await db.select("students", { id: studentId });
  if (!student) return false;
  if (u.role === "student") return u.student_id === studentId;
  if (u.role === "parent") return !!u.parent_id && parentCanSee(db, u.parent_id, student);
  return canStaffOffice(u, student.office_id);
}

export async function assertCanSeeStudent(db: Db, u: SessionUser | null, studentId: string) {
  if (!(await canSeeStudent(db, u, studentId))) {
    throw new HttpError(u ? 403 : 401, u?.role === "parent" ? "This needs your child's consent first." : "You do not have access to this student.");
  }
}
