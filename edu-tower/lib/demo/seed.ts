import type { Tables, TableName } from "@/lib/types";

/**
 * Sample data for demo mode. Dates are relative to the moment the store is
 * created so "today's classes" and 48-hour holds always look current.
 * Names and numbers are fictional.
 */
export type DemoTables = { [K in TableName]: Tables[K][] };

const DAY = 86_400_000;

function iso(d: Date) {
  return d.toISOString();
}
function dateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}
function at(base: Date, dayOffset: number, hour: number, minute = 0) {
  const d = new Date(base.getTime() + dayOffset * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function buildSeed(now = new Date()): DemoTables {
  const t: DemoTables = {
    offices: [
      { id: "mumbai", name: "Mumbai", address: "Andheri West, Mumbai", whatsapp: "919800000001" },
      { id: "vadodara", name: "Vadodara", address: "Alkapuri, Vadodara", whatsapp: "919800000002" },
    ],
    users: [
      { id: "u-admin", role: "admin", office_id: null, full_name: "Azim (Admin)", phone: null, email: "admin@edutower.example" },
      { id: "u-coun-mum", role: "counsellor", office_id: "mumbai", full_name: "Nisha (Counsellor, Mumbai)", phone: null, email: null },
      { id: "u-coun-vad", role: "counsellor", office_id: "vadodara", full_name: "Hardik (Counsellor, Vadodara)", phone: null, email: null },
      { id: "u-teach-mum", role: "teacher", office_id: "mumbai", full_name: "Ms. Fernandes (Teacher, Mumbai)", phone: null, email: null },
      { id: "u-teach-vad", role: "teacher", office_id: "vadodara", full_name: "Mr. Joshi (Teacher, Vadodara)", phone: null, email: null },
      { id: "u-st-riya", role: "student", office_id: "mumbai", full_name: "Riya Shah", phone: "919811110001", email: null },
      { id: "u-st-meera", role: "student", office_id: "mumbai", full_name: "Meera Iyer", phone: "919811110002", email: null },
      { id: "u-st-arjun", role: "student", office_id: "vadodara", full_name: "Arjun Patel", phone: "919811110003", email: null },
      { id: "u-st-kabir", role: "student", office_id: "vadodara", full_name: "Kabir Desai", phone: "919811110004", email: null },
      { id: "u-pa-shah", role: "parent", office_id: null, full_name: "Mr. Shah (Riya's parent)", phone: "919822220001", email: null },
      { id: "u-pa-patel", role: "parent", office_id: null, full_name: "Mrs. Patel (Arjun's parent)", phone: "919822220002", email: null },
      { id: "u-pa-desai", role: "parent", office_id: null, full_name: "Mr. Desai (Kabir's parent)", phone: "919822220003", email: null },
    ],
    students: [
      { id: "st-riya", user_id: "u-st-riya", office_id: "mumbai", full_name: "Riya Shah", phone: "919811110001", date_of_birth: "2009-03-14", target_exam: "ielts_academic", target_band: 7 },
      { id: "st-meera", user_id: "u-st-meera", office_id: "mumbai", full_name: "Meera Iyer", phone: "919811110002", date_of_birth: "2000-11-02", target_exam: "ielts_ukvi", target_band: 6 },
      { id: "st-arjun", user_id: "u-st-arjun", office_id: "vadodara", full_name: "Arjun Patel", phone: "919811110003", date_of_birth: "2003-08-02", target_exam: "ielts_general", target_band: 6.5 },
      { id: "st-kabir", user_id: "u-st-kabir", office_id: "vadodara", full_name: "Kabir Desai", phone: "919811110004", date_of_birth: "2010-01-20", target_exam: "ielts_academic", target_band: 6.5 },
    ],
    parents: [
      { id: "pa-shah", user_id: "u-pa-shah", full_name: "Mr. Shah", phone: "919822220001" },
      { id: "pa-patel", user_id: "u-pa-patel", full_name: "Mrs. Patel", phone: "919822220002" },
      { id: "pa-desai", user_id: "u-pa-desai", full_name: "Mr. Desai", phone: "919822220003" },
    ],
    parent_links: [
      { parent_id: "pa-shah", student_id: "st-riya", relation: "father" },
      { parent_id: "pa-patel", student_id: "st-arjun", relation: "mother" },
      { parent_id: "pa-desai", student_id: "st-kabir", relation: "father" },
    ],
    consents: [
      // Riya is 17: she agreed to share AND her parent signed the minor consent.
      { id: "c-1", student_id: "st-riya", parent_id: "pa-shah", kind: "parent_share", granted_by: "u-st-riya", granted_at: iso(at(now, -20, 10)), revoked_at: null, evidence_path: null },
      { id: "c-2", student_id: "st-riya", parent_id: "pa-shah", kind: "parent_signed_minor", granted_by: "u-coun-mum", granted_at: iso(at(now, -20, 11)), revoked_at: null, evidence_path: "consents/st-riya-signed.pdf" },
      // Kabir is 16: he agreed, but the signed parent form is still missing.
      { id: "c-3", student_id: "st-kabir", parent_id: "pa-desai", kind: "parent_share", granted_by: "u-st-kabir", granted_at: iso(at(now, -10, 10)), revoked_at: null, evidence_path: null },
      // Arjun (adult) has not agreed to share — his parent sees nothing.
    ],
    courses: [
      { id: "english-foundation", name: "Spoken & Written English", exam: "english", description: "Grammar, fluency and confidence for everyday and workplace English. Small groups, lots of speaking.", weeks: 8, fee_inr: 12000, active: true },
      { id: "ielts-academic", name: "IELTS Academic", exam: "ielts_academic", description: "For university admission abroad. All four skills, weekly full mocks and band-by-band writing feedback.", weeks: 6, fee_inr: 18000, active: true },
      { id: "ielts-general", name: "IELTS General Training", exam: "ielts_general", description: "For work and migration. Letter writing, everyday reading and speaking practice.", weeks: 6, fee_inr: 16000, active: true },
      { id: "ielts-ukvi", name: "IELTS for UKVI", exam: "ielts_ukvi", description: "The UK visa version of IELTS. Same format, with test-day procedures for UKVI centres.", weeks: 6, fee_inr: 17000, active: true },
      { id: "pte-academic", name: "PTE Academic", exam: "pte", description: "Computer-based test prep: templates for speaking and writing, timed drills, AI-scored practice.", weeks: 5, fee_inr: 15000, active: true },
      { id: "celpip-general", name: "CELPIP General", exam: "celpip", description: "For Canadian immigration. Computer-delivered test practice for all four components.", weeks: 5, fee_inr: 15000, active: true },
      { id: "coaching-1to1", name: "1-to-1 Coaching", exam: "coaching", description: "Private sessions built around your weakest skill. Flexible timings, any exam.", weeks: 4, fee_inr: 24000, active: true },
    ],
    batches: [
      { id: "b-mum-ielts-now", course_id: "ielts-academic", office_id: "mumbai", start_date: dateOnly(at(now, -21, 9)), end_date: dateOnly(at(now, 21, 9)), schedule: "Mon–Fri · 7:00–9:00 pm", seats: 12, status: "open", teacher_id: "u-teach-mum" },
      { id: "b-mum-ielts-next", course_id: "ielts-academic", office_id: "mumbai", start_date: dateOnly(at(now, 7, 9)), end_date: null, schedule: "Mon–Fri · 7:00–9:00 am", seats: 12, status: "open", teacher_id: "u-teach-mum" },
      { id: "b-mum-pte", course_id: "pte-academic", office_id: "mumbai", start_date: dateOnly(at(now, 10, 9)), end_date: null, schedule: "Tue/Thu/Sat · 4:00–6:00 pm", seats: 10, status: "open", teacher_id: "u-teach-mum" },
      { id: "b-mum-english", course_id: "english-foundation", office_id: "mumbai", start_date: dateOnly(at(now, 5, 9)), end_date: null, schedule: "Sat/Sun · 10:00 am–1:00 pm", seats: 2, status: "open", teacher_id: "u-teach-mum" },
      { id: "b-vad-ielts-now", course_id: "ielts-general", office_id: "vadodara", start_date: dateOnly(at(now, -14, 9)), end_date: dateOnly(at(now, 28, 9)), schedule: "Mon–Fri · 6:00–8:00 pm", seats: 10, status: "open", teacher_id: "u-teach-vad" },
      { id: "b-vad-ielts-ac", course_id: "ielts-academic", office_id: "vadodara", start_date: dateOnly(at(now, 12, 9)), end_date: null, schedule: "Mon–Fri · 11:00 am–1:00 pm", seats: 12, status: "open", teacher_id: "u-teach-vad" },
      { id: "b-vad-celpip", course_id: "celpip-general", office_id: "vadodara", start_date: dateOnly(at(now, 9, 9)), end_date: null, schedule: "Mon/Wed/Fri · 5:00–7:00 pm", seats: 8, status: "open", teacher_id: "u-teach-vad" },
    ],
    enrolments: [
      { student_id: "st-riya", batch_id: "b-mum-ielts-now", enrolled_at: iso(at(now, -22, 10)) },
      { student_id: "st-meera", batch_id: "b-mum-ielts-now", enrolled_at: iso(at(now, -22, 12)) },
      { student_id: "st-arjun", batch_id: "b-vad-ielts-now", enrolled_at: iso(at(now, -15, 10)) },
      { student_id: "st-kabir", batch_id: "b-vad-ielts-now", enrolled_at: iso(at(now, -15, 11)) },
    ],
    bookings: [
      { id: "bk-1", batch_id: "b-mum-ielts-next", office_id: "mumbai", student_id: null, full_name: "Tanvi Mehta", phone: "919833330001", diagnostic_id: "dg-tanvi", status: "held", held_until: iso(new Date(now.getTime() + 43 * 3_600_000)), confirmed_by: null, confirmed_at: null, created_at: iso(new Date(now.getTime() - 5 * 3_600_000)) },
      { id: "bk-2", batch_id: "b-mum-english", office_id: "mumbai", student_id: null, full_name: "Rohan Kapoor", phone: "919833330002", diagnostic_id: null, status: "held", held_until: iso(new Date(now.getTime() + 20 * 3_600_000)), confirmed_by: null, confirmed_at: null, created_at: iso(new Date(now.getTime() - 28 * 3_600_000)) },
      { id: "bk-3", batch_id: "b-vad-celpip", office_id: "vadodara", student_id: null, full_name: "Simran Gill", phone: "919833330003", diagnostic_id: null, status: "held", held_until: iso(new Date(now.getTime() + 30 * 3_600_000)), confirmed_by: null, confirmed_at: null, created_at: iso(new Date(now.getTime() - 18 * 3_600_000)) },
    ],
    classes: [],
    attendance: [],
    homework: [],
    homework_status: [],
    tests: [
      { id: "t-diagnostic", kind: "diagnostic", exam: "ielts_academic", title: "Free English Diagnostic", duration_min: 15, office_id: null, scheduled_at: null, file_path: null },
      { id: "t-mock-ac-1", kind: "mock", exam: "ielts_academic", title: "IELTS Academic Mock 1", duration_min: 60, office_id: null, scheduled_at: iso(at(now, 0, 10)), file_path: null },
      { id: "t-practice", kind: "practice", exam: "ielts_academic", title: "Practice bank", duration_min: 20, office_id: null, scheduled_at: null, file_path: null },
    ],
    questions: [],
    submissions: [],
    scores: [],
    reports: [],
    content_entries: [],
    ai_logs: [],
    diagnostics: [
      { id: "dg-tanvi", student_id: null, exam: "ielts_academic", band_estimate: 6, skill_bands: { reading: 6.5, listening: 6.5, writing: 5.5, speaking: 6 }, weakest_skill: "writing", suggested_course: "ielts-academic", created_at: iso(new Date(now.getTime() - 6 * 3_600_000)) },
    ],
  };

  t.questions.push(...diagnosticQuestions(), ...mockQuestions(), ...bankQuestions());
  t.content_entries.push(...approvedContent(now));
  seedClasses(t, now);
  seedMockResults(t, now);
  return t;
}

// ------------------------------------------------------------------
// Questions
// ------------------------------------------------------------------
const READING_PASSAGE =
  "Urban rooftop gardens have spread quickly across Indian cities over the last decade. Supporters say they cool buildings, cut grocery bills and give children a place to learn where food comes from. Critics point out that many rooftops were never designed to carry the weight of wet soil, and that without proper waterproofing the gardens can damage the homes beneath them. Most experts now recommend lightweight growing beds and a structural check before any planting begins.";

const LISTENING_SCRIPT =
  "Good morning, everyone. Before we start, a few changes to this week's timetable. The library tour moves from Tuesday to Thursday at eleven. Please bring your student card, because you will not be able to enter without it. The writing workshop stays on Wednesday, but it is now in Room 14 instead of the main hall. And finally, the speaking club is cancelled this week because the coordinator is away.";

function diagnosticQuestions(): Tables["questions"][] {
  const base = { test_id: "t-diagnostic", level: "B1–B2", source: "teacher" as const, review_state: "approved" as const, reviewed_by: "u-teach-mum" };
  return [
    { ...base, id: "dq-r1", skill: "reading", passage: READING_PASSAGE, prompt: "What is the main concern raised by critics?", options: ["Gardens are too expensive", "Roofs may not carry the weight", "Children are not interested", "Food grown on roofs is unsafe"], answer_key: "Roofs may not carry the weight" },
    { ...base, id: "dq-r2", skill: "reading", passage: READING_PASSAGE, prompt: "Which benefit is NOT mentioned?", options: ["Cooler buildings", "Lower grocery bills", "Cleaner air", "Education for children"], answer_key: "Cleaner air" },
    { ...base, id: "dq-r3", skill: "reading", passage: READING_PASSAGE, prompt: "What do experts recommend before planting?", options: ["A structural check", "Planting only flowers", "Using heavy clay soil", "Asking the neighbours"], answer_key: "A structural check" },
    { ...base, id: "dq-l1", skill: "listening", passage: LISTENING_SCRIPT, prompt: "When is the library tour now?", options: ["Tuesday at eleven", "Thursday at eleven", "Wednesday at eleven", "Thursday at seven"], answer_key: "Thursday at eleven" },
    { ...base, id: "dq-l2", skill: "listening", passage: LISTENING_SCRIPT, prompt: "What must students bring to the tour?", options: ["A notebook", "Their timetable", "Their student card", "A pen"], answer_key: "Their student card" },
    { ...base, id: "dq-l3", skill: "listening", passage: LISTENING_SCRIPT, prompt: "Why is the speaking club cancelled?", options: ["The room is booked", "Too few students", "The coordinator is away", "It is a holiday"], answer_key: "The coordinator is away" },
    { ...base, id: "dq-w1", skill: "writing", passage: null, prompt: "Some people think children should learn to cook at school. Do you agree or disagree? Write at least 80 words.", options: null, answer_key: null },
    { ...base, id: "dq-s1", skill: "speaking", passage: null, prompt: "Describe a place in your city that you like to visit. Say where it is, what you do there and why you like it. Speak for about one minute.", options: null, answer_key: null },
  ];
}

function mockQuestions(): Tables["questions"][] {
  const base = { test_id: "t-mock-ac-1", level: "band 5–7", source: "teacher" as const, review_state: "approved" as const, reviewed_by: "u-teach-mum" };
  const passage =
    "The Indian monsoon delivers roughly three-quarters of the country's annual rainfall between June and September. Its arrival is forecast each year by the national weather department, but small shifts in timing can have large effects: a delay of two weeks may force farmers to replant, while an early, intense start can overwhelm drainage in cities. Researchers are now combining satellite data with ocean temperature records to improve forecasts, though they caution that local rainfall will always be harder to predict than the national total.";
  const script =
    "Thanks for calling City Sports Centre. Our new swimming course for adults begins on the fifth of next month. Classes run on Monday and Friday evenings from half past six. The full course is eight weeks and costs four thousand two hundred rupees, which includes the entry fee. You will need to bring your own cap; goggles can be borrowed from the front desk.";
  return [
    { ...base, id: "mq-r1", skill: "reading", passage, prompt: "Roughly what share of annual rainfall comes with the monsoon?", options: ["One-quarter", "One-half", "Three-quarters", "Almost all"], answer_key: "Three-quarters" },
    { ...base, id: "mq-r2", skill: "reading", passage, prompt: "According to the passage, a two-week delay may mean that farmers…", options: ["must plant again", "harvest early", "move to cities", "stop farming"], answer_key: "must plant again" },
    { ...base, id: "mq-r3", skill: "reading", passage, prompt: "What are researchers combining with satellite data?", options: ["Crop prices", "Ocean temperature records", "City drainage maps", "Farmer surveys"], answer_key: "Ocean temperature records" },
    { ...base, id: "mq-r4", skill: "reading", passage, prompt: "Researchers say which is harder to predict?", options: ["The national total", "Ocean temperature", "Local rainfall", "The end of the season"], answer_key: "Local rainfall" },
    { ...base, id: "mq-l1", skill: "listening", passage: script, prompt: "On which days are the classes?", options: ["Monday and Wednesday", "Monday and Friday", "Tuesday and Friday", "Weekends"], answer_key: "Monday and Friday" },
    { ...base, id: "mq-l2", skill: "listening", passage: script, prompt: "How long is the course?", options: ["Four weeks", "Six weeks", "Eight weeks", "Ten weeks"], answer_key: "Eight weeks" },
    { ...base, id: "mq-l3", skill: "listening", passage: script, prompt: "What must students bring?", options: ["Goggles", "A towel", "A swimming cap", "A medical form"], answer_key: "A swimming cap" },
    { ...base, id: "mq-w1", skill: "writing", passage: null, prompt: "Writing Task 2: In many countries, more people are choosing to work from home. Discuss the advantages and disadvantages and give your own opinion. Write at least 250 words.", options: null, answer_key: null },
    { ...base, id: "mq-s1", skill: "speaking", passage: null, prompt: "Speaking Part 2: Describe a skill you learned that has been useful to you. Say what it is, how you learned it, and explain why it has been useful.", options: null, answer_key: null },
  ];
}

function bankQuestions(): Tables["questions"][] {
  const base = { test_id: null, source: "teacher" as const, review_state: "approved" as const, reviewed_by: "u-teach-mum", passage: null };
  return [
    { ...base, id: "bq-w1", skill: "writing", level: "band 6", prompt: "Write a paragraph (100–150 words) on whether public transport should be free in large cities.", options: null, answer_key: null },
    { ...base, id: "bq-s1", skill: "speaking", level: "band 6", prompt: "Talk for one minute about a festival you enjoy and how your family celebrates it.", options: null, answer_key: null },
    { ...base, id: "bq-w2", skill: "writing", level: "band 6.5", prompt: "Write a letter to your landlord explaining a problem in your flat and asking for it to be fixed.", options: null, answer_key: null },
  ];
}

// ------------------------------------------------------------------
// Approved helper content (FAQ, courses, fees)
// ------------------------------------------------------------------
function approvedContent(now: Date): Tables["content_entries"][] {
  const u = { updated_by: "u-admin", updated_at: iso(now), approved: true };
  return [
    { ...u, id: "ce-1", kind: "fee", title: "Course fees", tags: ["fee", "price", "cost", "pay", "installment"], body: "IELTS Academic ₹18,000 (6 weeks). IELTS General ₹16,000. IELTS for UKVI ₹17,000. PTE Academic ₹15,000 (5 weeks). CELPIP General ₹15,000. Spoken & Written English ₹12,000 (8 weeks). 1-to-1 coaching ₹24,000 for 4 weeks. Fees can be paid in two instalments: half at confirmation and half in week 2." },
    { ...u, id: "ce-2", kind: "faq", title: "Where are your offices?", tags: ["office", "address", "location", "mumbai", "vadodara", "where"], body: "We teach at two offices: Andheri West in Mumbai and Alkapuri in Vadodara. Every batch belongs to one office, so choose the office closest to you when you book." },
    { ...u, id: "ce-3", kind: "faq", title: "How does booking a seat work?", tags: ["book", "seat", "batch", "hold", "confirm", "whatsapp"], body: "Pick a course, office and start date. We hold your seat for 48 hours. A counsellor will message you on WhatsApp to confirm and share payment details. If we do not confirm within 48 hours, the seat is released." },
    { ...u, id: "ce-4", kind: "faq", title: "Which IELTS should I take?", tags: ["ielts", "academic", "general", "ukvi", "which", "difference"], body: "IELTS Academic is for university admission. IELTS General Training is for work and migration (for example Canada, Australia, New Zealand). IELTS for UKVI is the version required for many UK visa applications. Ask your university or visa authority which one they accept." },
    { ...u, id: "ce-5", kind: "faq", title: "What are mock tests?", tags: ["mock", "test", "practice", "exam", "timing"], body: "Mock tests are full-length tests under real exam timing. Reading and listening are marked automatically. Writing and speaking get an AI estimate first, then a teacher reviews and confirms your score." },
    { ...u, id: "ce-6", kind: "faq", title: "What is the free diagnostic?", tags: ["diagnostic", "free", "level", "band", "test", "start"], body: "The free diagnostic is a 15-minute check of reading, writing, listening and speaking. It gives you a band estimate, shows your weakest skill and suggests a course. Your result is saved so you do not have to repeat it when you book." },
    { ...u, id: "ce-7", kind: "policy", title: "Refund policy", tags: ["refund", "cancel", "money back"], body: "You can cancel before the batch start date for a full refund. After the first week, fees can be moved to a later batch but are not refunded." },
    { ...u, id: "ce-8", kind: "faq", title: "Class timings", tags: ["timing", "time", "schedule", "morning", "evening", "weekend"], body: "Most batches run Monday to Friday for two hours, with morning and evening options. Weekend batches are available for Spoken English. Each batch's exact schedule is shown on the booking page." },
    { ...u, id: "ce-9", kind: "faq", title: "Do you help with visas?", tags: ["visa", "immigration", "bank", "europe", "passport"], body: "We only teach. We do not offer visa, banking or immigration services. Our counsellors can tell you which test your goal usually needs." },
    { ...u, id: "ce-10", kind: "course", title: "PTE and CELPIP", tags: ["pte", "celpip", "canada", "computer"], body: "PTE Academic is a computer-based English test accepted by many universities and for Australian visas. CELPIP is Canada's computer-delivered English test for immigration. We run separate batches for each." },
  ];
}

// ------------------------------------------------------------------
// Classes, attendance and homework for running batches
// ------------------------------------------------------------------
function seedClasses(t: DemoTables, now: Date) {
  const topics = ["Reading: skimming and scanning", "Listening: map and form completion", "Writing Task 2 structure", "Speaking Part 2 practice", "Grammar for band 7", "Vocabulary: environment", "Writing Task 1: graphs"];
  const running = [
    { batch: "b-mum-ielts-now", students: ["st-riya", "st-meera"], teacher: "u-teach-mum", hour: 19 },
    { batch: "b-vad-ielts-now", students: ["st-arjun", "st-kabir"], teacher: "u-teach-vad", hour: 18 },
  ];
  // Fixed attendance pattern so demo reports read the same every time.
  const absent: Record<string, number[]> = { "st-meera": [2, 6], "st-kabir": [1, 4, 8], "st-arjun": [5] };
  const missedHw: Record<string, number[]> = { "st-meera": [1], "st-kabir": [0, 2], "st-arjun": [] , "st-riya": [3] };

  for (const r of running) {
    let n = 0;
    for (let d = -13; d <= 1; d++) {
      const day = at(now, d, r.hour);
      const dow = day.getDay();
      if (dow === 0 || dow === 6) continue;
      const classId = `cl-${r.batch}-${n}`;
      t.classes.push({ id: classId, batch_id: r.batch, starts_at: iso(day), topic: topics[n % topics.length] });
      const past = day.getTime() < now.getTime() - 3_600_000;
      if (past) {
        for (const s of r.students) {
          t.attendance.push({ class_id: classId, student_id: s, status: absent[s]?.includes(n) ? "absent" : "present", marked_by: r.teacher, marked_at: iso(day) });
        }
      }
      if (n % 2 === 0) {
        const hwIndex = n / 2;
        const hwId = `hw-${r.batch}-${hwIndex}`;
        t.homework.push({ id: hwId, class_id: classId, title: `Homework ${hwIndex + 1}: ${topics[n % topics.length]}`, due_at: iso(at(now, d + 2, 23, 59)) });
        for (const s of r.students) {
          const due = at(now, d + 2, 23, 59).getTime() < now.getTime();
          t.homework_status.push({ homework_id: hwId, student_id: s, status: !due ? "assigned" : missedHw[s]?.includes(hwIndex) ? "missing" : "submitted" });
        }
      }
      n++;
    }
  }
}

function seedMockResults(t: DemoTables, now: Date) {
  const add = (
    id: string,
    student: string,
    skill: "writing" | "objective",
    status: Tables["submissions"]["status"],
    daysAgo: number,
    score: Partial<Tables["scores"]>,
    body: string | null = null,
  ) => {
    t.submissions.push({ id, student_id: student, test_id: "t-mock-ac-1", question_id: skill === "writing" ? "mq-w1" : null, kind: "mock", skill, body_text: body, file_path: null, transcript: null, answers: null, status, attempts: 1, created_at: iso(at(now, -daysAgo, 11)), released_at: status === "released" ? iso(at(now, -daysAgo + 1, 11)) : null });
    t.scores.push({ submission_id: id, ai_estimate: null, ai_band: null, objective_raw: null, objective_max: null, final_band: null, final_by: null, final_note: null, updated_at: iso(at(now, -daysAgo, 12)), ...score });
  };
  const est = (band: number, reasons: [string, string, string, string]) => ({
    band,
    criteria: [
      { name: "Task response", band, reason: reasons[0] },
      { name: "Coherence and cohesion", band, reason: reasons[1] },
      { name: "Lexical resource", band: band - 0.5, reason: reasons[2] },
      { name: "Grammatical range and accuracy", band, reason: reasons[3] },
    ],
    feedback: "Clear position and a logical structure. Develop each main idea with one specific example, and vary sentence openings.",
    corrected_sample: "Working from home saves commuting time, which many employees use to rest or to look after their families…",
  });

  add("sub-riya-r", "st-riya", "objective", "released", 9, { objective_raw: 3, objective_max: 4, ai_band: 6.5, final_band: 6.5 });
  add("sub-riya-w", "st-riya", "writing", "released", 9, { ai_estimate: est(6, ["Answers both parts of the question.", "Paragraphs are logical; linking is a little repetitive.", "Some imprecise word choice.", "Mix of simple and complex sentences with minor errors."]), ai_band: 6, final_band: 6.5, final_by: "u-teach-mum", final_note: "Strong conclusion; raised half a band." }, "Nowadays many companies allow staff to work from home. In my opinion this has more advantages than disadvantages…");
  add("sub-meera-w", "st-meera", "writing", "awaiting_review", 2, { ai_estimate: est(5.5, ["Position is unclear until the conclusion.", "Ideas are grouped but paragraphs are short.", "Limited range; some repetition.", "Frequent article errors."]), ai_band: 5.5 }, "Work from home is very popular now. There is many advantage for workers and also some problem. First advantage is time…");
  add("sub-arjun-r", "st-arjun", "objective", "released", 6, { objective_raw: 2, objective_max: 4, ai_band: 5.5, final_band: 5.5 });
  add("sub-arjun-w", "st-arjun", "writing", "released", 6, { ai_estimate: est(6, ["Covers both views with an opinion.", "Clear paragraphs.", "Adequate range.", "Good control with some errors."]), ai_band: 6, final_band: 6, final_by: "u-teach-vad", final_note: null }, "Remote work has become common in the last few years…");
  add("sub-kabir-w", "st-kabir", "writing", "awaiting_review", 1, { ai_estimate: est(5, ["Partly addresses the task.", "Limited paragraphing.", "Basic vocabulary.", "Many errors in tense."]), ai_band: 5 }, "I think work from home is good because no traffic…");
}
