export type OfficeId = "mumbai" | "vadodara";
export type Role = "admin" | "counsellor" | "teacher" | "student" | "parent";
export type Skill = "reading" | "writing" | "listening" | "speaking";
export const SKILLS: Skill[] = ["reading", "writing", "listening", "speaking"];

export type Exam =
  | "english"
  | "ielts_academic"
  | "ielts_general"
  | "ielts_ukvi"
  | "pte"
  | "celpip"
  | "coaching";

export interface Office {
  id: OfficeId;
  name: string;
  address: string | null;
  whatsapp: string | null;
}

export interface User {
  id: string;
  role: Role;
  office_id: OfficeId | null;
  full_name: string;
  phone: string | null;
  email: string | null;
}

/** The signed-in user as loaded at the top of every request. */
export interface SessionUser extends User {
  student_id: string | null;
  parent_id: string | null;
}

export interface Course {
  id: string;
  name: string;
  exam: Exam;
  description: string;
  weeks: number;
  fee_inr: number;
  active: boolean;
}

export interface Batch {
  id: string;
  course_id: string;
  office_id: OfficeId;
  start_date: string;
  end_date: string | null;
  schedule: string;
  seats: number;
  status: "open" | "closed" | "completed";
  teacher_id: string | null;
}

export interface BatchWithSeats extends Batch {
  seats_taken: number;
  seats_left: number;
}

export interface Enrolment {
  student_id: string;
  batch_id: string;
  enrolled_at: string;
}

export type BookingStatus = "held" | "confirmed" | "expired" | "cancelled";
export interface Booking {
  id: string;
  batch_id: string;
  office_id: OfficeId;
  student_id: string | null;
  full_name: string;
  phone: string;
  diagnostic_id: string | null;
  status: BookingStatus;
  held_until: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string | null;
  office_id: OfficeId;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  target_exam: Exam | null;
  target_band: number | null;
}

export interface Parent {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
}

export interface ParentLink {
  parent_id: string;
  student_id: string;
  relation: string | null;
}

export type ConsentKind = "parent_share" | "parent_signed_minor" | "audio_retention";
export interface Consent {
  id: string;
  student_id: string;
  parent_id: string | null;
  kind: ConsentKind;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  evidence_path: string | null;
}

export interface ClassSession {
  id: string;
  batch_id: string;
  starts_at: string;
  topic: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export interface Attendance {
  class_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_by: string | null;
  marked_at: string;
}

export interface Homework {
  id: string;
  class_id: string;
  title: string;
  due_at: string;
}

export type HomeworkState = "assigned" | "submitted" | "late" | "missing";
export interface HomeworkStatus {
  homework_id: string;
  student_id: string;
  status: HomeworkState;
}

export type TestKind = "diagnostic" | "mock" | "practice";
export interface Test {
  id: string;
  kind: TestKind;
  exam: Exam;
  title: string;
  duration_min: number;
  office_id: OfficeId | null;
  scheduled_at: string | null;
  file_path: string | null;
}

export interface Question {
  id: string;
  test_id: string | null;
  skill: Skill;
  level: string;
  prompt: string;
  /** Reading/listening passage or audio script shown before the question. */
  passage?: string | null;
  options: string[] | null;
  /** Server-only. Never serialise to the browser. */
  answer_key: string | null;
  source: "teacher" | "ai_generated";
  review_state: "pending_review" | "approved" | "rejected";
  reviewed_by: string | null;
}

/** A question as the browser is allowed to see it. */
export type PublicQuestion = Omit<Question, "answer_key" | "reviewed_by">;

export type SubmissionStatus = "queued" | "processing" | "awaiting_review" | "released" | "needs_teacher";
export interface Submission {
  id: string;
  student_id: string | null;
  test_id: string | null;
  question_id: string | null;
  kind: TestKind;
  skill: Skill | "objective";
  body_text: string | null;
  file_path: string | null;
  transcript: string | null;
  answers: Record<string, string> | null;
  status: SubmissionStatus;
  attempts: number;
  created_at: string;
  released_at: string | null;
}

export interface CriterionScore {
  name: string;
  band: number;
  reason: string;
}

export interface AiEstimate {
  band: number;
  criteria: CriterionScore[];
  feedback: string;
  corrected_sample: string;
}

export interface Score {
  submission_id: string;
  ai_estimate: AiEstimate | null;
  ai_band: number | null;
  objective_raw: number | null;
  objective_max: number | null;
  final_band: number | null;
  final_by: string | null;
  final_note: string | null;
  updated_at: string;
}

export interface WeekData {
  student_name: string;
  week_start: string;
  attendance_present: number;
  attendance_total: number;
  homework_done: number;
  homework_total: number;
  mocks: { title: string; band: number; is_estimate: boolean }[];
  target_band: number | null;
  latest_band: number | null;
  next_focus: Skill;
}

export interface Report {
  id: string;
  student_id: string;
  week_start: string;
  data: WeekData;
  body_text: string;
  status: "draft" | "approved" | "sent";
  approved_by: string | null;
  approved_at: string | null;
  sent_student_at: string | null;
  sent_parent_at: string | null;
}

export interface ContentEntry {
  id: string;
  kind: "faq" | "course" | "fee" | "policy";
  title: string;
  body: string;
  tags: string[];
  approved: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface Diagnostic {
  id: string;
  student_id: string | null;
  exam: Exam;
  band_estimate: number;
  skill_bands: Record<Skill, number>;
  weakest_skill: Skill;
  suggested_course: string | null;
  created_at: string;
}

export interface AiLog {
  id: string;
  user_id: string | null;
  feature: "ask" | "diagnostic" | "feedback" | "practice" | "report" | "transcribe";
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  question: string | null;
  answer: string | null;
  created_at: string;
}

export interface Tables {
  offices: Office;
  users: User;
  students: Student;
  parents: Parent;
  parent_links: ParentLink;
  consents: Consent;
  courses: Course;
  batches: Batch;
  enrolments: Enrolment;
  bookings: Booking;
  classes: ClassSession;
  attendance: Attendance;
  homework: Homework;
  homework_status: HomeworkStatus;
  tests: Test;
  questions: Question;
  submissions: Submission;
  scores: Score;
  reports: Report;
  content_entries: ContentEntry;
  ai_logs: AiLog;
  diagnostics: Diagnostic;
}
export type TableName = keyof Tables;
