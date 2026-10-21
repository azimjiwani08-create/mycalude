-- Edu Tower education platform: core schema.
-- Every batch, booking and staff record belongs to exactly one office.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Reference
-- ---------------------------------------------------------------
create table offices (
  id          text primary key,              -- 'mumbai' | 'vadodara'
  name        text not null,
  address     text,
  whatsapp    text                           -- counsellor desk number, digits only
);

create table roles (
  id          text primary key,              -- admin | counsellor | teacher | student | parent
  description text not null
);

-- ---------------------------------------------------------------
-- People
-- ---------------------------------------------------------------
create table users (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null references roles (id),
  office_id   text references offices (id),  -- required for staff; students inherit from batch
  full_name   text not null,
  phone       text,
  email       text,
  created_at  timestamptz not null default now(),
  constraint staff_have_office check (role in ('student', 'parent', 'admin') or office_id is not null)
);

create table students (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid unique references users (id) on delete set null,
  office_id      text not null references offices (id),
  full_name      text not null,
  phone          text,
  date_of_birth  date,                        -- only to decide under-18 consent rules
  target_exam    text,
  target_band    numeric(3,1),
  created_at     timestamptz not null default now()
);

create table parents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references users (id) on delete set null,
  full_name   text not null,
  phone       text,
  created_at  timestamptz not null default now()
);

create table parent_links (
  parent_id   uuid not null references parents (id) on delete cascade,
  student_id  uuid not null references students (id) on delete cascade,
  relation    text,
  primary key (parent_id, student_id)
);

-- One row per consent decision. Latest unrevoked row wins.
create table consents (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students (id) on delete cascade,
  parent_id     uuid references parents (id) on delete cascade,
  kind          text not null check (kind in ('parent_share', 'parent_signed_minor', 'audio_retention')),
  granted_by    uuid references users (id),
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  evidence_path text                           -- signed form in private storage, for minors
);
create index consents_student_idx on consents (student_id, kind);

-- ---------------------------------------------------------------
-- Catalogue and batches
-- ---------------------------------------------------------------
create table courses (
  id           text primary key,              -- 'ielts-academic', 'pte', ...
  name         text not null,
  exam         text not null check (exam in ('english', 'ielts_academic', 'ielts_general', 'ielts_ukvi', 'pte', 'celpip', 'coaching')),
  description  text not null,
  weeks        int not null,
  fee_inr      int not null,
  active       boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table batches (
  id          uuid primary key default gen_random_uuid(),
  course_id   text not null references courses (id),
  office_id   text not null references offices (id),
  start_date  date not null,
  end_date    date,
  schedule    text not null,                  -- 'Mon–Fri 7–9 pm'
  seats       int not null check (seats > 0),
  status      text not null default 'open' check (status in ('open', 'closed', 'completed')),
  teacher_id  uuid references users (id),
  created_at  timestamptz not null default now()
);
create index batches_office_idx on batches (office_id, status);

create table enrolments (
  student_id  uuid not null references students (id) on delete cascade,
  batch_id    uuid not null references batches (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (student_id, batch_id)
);

create table bookings (
  id             uuid primary key default gen_random_uuid(),
  batch_id       uuid not null references batches (id),
  office_id      text not null references offices (id),
  student_id     uuid references students (id),
  full_name      text not null,
  phone          text not null,
  diagnostic_id  uuid,                         -- carries the diagnostic forward, no retyping
  status         text not null default 'held' check (status in ('held', 'confirmed', 'expired', 'cancelled')),
  held_until     timestamptz not null default (now() + interval '48 hours'),
  confirmed_by   uuid references users (id),
  confirmed_at   timestamptz,
  created_at     timestamptz not null default now()
);
create index bookings_office_status_idx on bookings (office_id, status);

-- Seats taken = enrolled + live holds. Enforced by reserve_seat().
create or replace function batch_seats_taken(p_batch uuid) returns int
language sql stable as $$
  select (select count(*) from enrolments e where e.batch_id = p_batch)::int
       + (select count(*) from bookings b
           where b.batch_id = p_batch and b.status = 'held' and b.held_until > now())::int
$$;

-- Atomic seat hold: locks the batch row so two requests cannot take the last seat.
create or replace function reserve_seat(p_batch uuid, p_name text, p_phone text, p_student uuid, p_diag uuid)
returns bookings
language plpgsql security definer set search_path = public as $$
declare
  b batches;
  result bookings;
begin
  select * into b from batches where id = p_batch for update;
  if b is null or b.status <> 'open' then
    raise exception 'batch_not_open';
  end if;
  if batch_seats_taken(p_batch) >= b.seats then
    raise exception 'batch_full';
  end if;
  insert into bookings (batch_id, office_id, student_id, full_name, phone, diagnostic_id)
  values (p_batch, b.office_id, p_student, p_name, p_phone, p_diag)
  returning * into result;
  return result;
end $$;

-- ---------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------
create table classes (
  id          uuid primary key default gen_random_uuid(),
  batch_id    uuid not null references batches (id) on delete cascade,
  starts_at   timestamptz not null,
  topic       text not null
);

create table attendance (
  class_id    uuid not null references classes (id) on delete cascade,
  student_id  uuid not null references students (id) on delete cascade,
  status      text not null check (status in ('present', 'absent', 'late', 'excused')),
  marked_by   uuid references users (id),
  marked_at   timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table homework (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes (id) on delete cascade,
  title       text not null,
  due_at      timestamptz not null
);

create table homework_status (
  homework_id uuid not null references homework (id) on delete cascade,
  student_id  uuid not null references students (id) on delete cascade,
  status      text not null check (status in ('assigned', 'submitted', 'late', 'missing')),
  primary key (homework_id, student_id)
);

-- ---------------------------------------------------------------
-- Tests, questions, submissions, scores
-- ---------------------------------------------------------------
create table tests (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('diagnostic', 'mock', 'practice')),
  exam          text not null,
  title         text not null,
  duration_min  int not null,
  office_id     text references offices (id),  -- null = available to all offices
  scheduled_at  timestamptz,
  file_path     text,                           -- private storage (audio, PDFs)
  created_by    uuid references users (id),
  created_at    timestamptz not null default now()
);

create table questions (
  id           uuid primary key default gen_random_uuid(),
  test_id      uuid references tests (id) on delete cascade,  -- null = shared bank
  skill        text not null check (skill in ('reading', 'writing', 'listening', 'speaking')),
  level        text not null,                                   -- 'B1', 'band 6', ...
  prompt       text not null,
  passage      text,                                            -- reading text or listening script
  options      jsonb,                                           -- objective only
  answer_key   jsonb,                                           -- never sent to the browser
  source       text not null default 'teacher' check (source in ('teacher', 'ai_generated')),
  review_state text not null default 'approved' check (review_state in ('pending_review', 'approved', 'rejected')),
  reviewed_by  uuid references users (id),
  created_at   timestamptz not null default now()
);

create table submissions (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references students (id) on delete cascade,
  test_id      uuid references tests (id),
  question_id  uuid references questions (id),
  kind         text not null check (kind in ('diagnostic', 'mock', 'practice')),
  skill        text not null,
  body_text    text,
  file_path    text,                             -- raw audio/writing upload, private
  transcript   text,
  answers      jsonb,                            -- objective answers
  status       text not null default 'queued'
               check (status in ('queued', 'processing', 'awaiting_review', 'released', 'needs_teacher')),
  attempts     int not null default 0,
  created_at   timestamptz not null default now(),
  released_at  timestamptz
);
create index submissions_status_idx on submissions (status);

create table scores (
  submission_id  uuid primary key references submissions (id) on delete cascade,
  ai_estimate    jsonb,          -- { band, criteria: [{name, band, reason}], corrected_sample }
  ai_band        numeric(3,1),
  objective_raw  int,
  objective_max  int,
  final_band     numeric(3,1),   -- teacher's decision; null until reviewed
  final_by       uuid references users (id),
  final_note     text,
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------
create table reports (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students (id) on delete cascade,
  week_start   date not null,
  data         jsonb not null,           -- structured numbers; the source of truth
  body_text    text not null,            -- wording from the report writer, numbers filled by code
  status       text not null default 'draft' check (status in ('draft', 'approved', 'sent')),
  approved_by  uuid references users (id),
  approved_at  timestamptz,
  sent_student_at timestamptz,
  sent_parent_at  timestamptz,
  unique (student_id, week_start)
);

-- ---------------------------------------------------------------
-- Content managed by staff, no code change needed
-- ---------------------------------------------------------------
create table content_entries (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('faq', 'course', 'fee', 'policy')),
  title       text not null,
  body        text not null,
  tags        text[] not null default '{}',
  approved    boolean not null default false,  -- only approved entries feed the Ask helper
  updated_by  uuid references users (id),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- AI usage log. Text is redacted before insert (no names, no phones).
-- ---------------------------------------------------------------
create table ai_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users (id) on delete set null,
  feature       text not null,             -- ask | diagnostic | feedback | practice | report | transcribe
  model         text not null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  cost_usd      numeric(10,6) not null default 0,
  question      text,
  answer        text,
  created_at    timestamptz not null default now()
);
create index ai_logs_user_day_idx on ai_logs (user_id, created_at);

-- Diagnostic results saved to the student's record (student may not exist yet).
create table diagnostics (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid references students (id) on delete set null,
  exam            text not null,
  band_estimate   numeric(3,1) not null,
  skill_bands     jsonb not null,
  weakest_skill   text not null,
  suggested_course text references courses (id),
  created_at      timestamptz not null default now()
);
alter table bookings add constraint bookings_diag_fk foreign key (diagnostic_id) references diagnostics (id);

insert into roles (id, description) values
  ('admin', 'All offices, all records'),
  ('counsellor', 'Bookings and students in own office'),
  ('teacher', 'Classes, attendance, marking in own office'),
  ('student', 'Own record only'),
  ('parent', 'Consented child records only');

insert into offices (id, name) values
  ('mumbai', 'Mumbai'),
  ('vadodara', 'Vadodara');
