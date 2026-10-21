-- Row-level security: a student sees only their own record, a parent only a
-- consented child's, staff only their own office. Admins see everything.
-- The service role (server jobs) bypasses RLS by design.

create schema if not exists app;

create or replace function app.role() returns text
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid()
$$;

create or replace function app.office() returns text
language sql stable security definer set search_path = public as $$
  select office_id from users where id = auth.uid()
$$;

create or replace function app.is_admin() returns boolean
language sql stable as $$ select coalesce(app.role() = 'admin', false) $$;

create or replace function app.is_staff_of(p_office text) returns boolean
language sql stable as $$
  select app.is_admin()
      or (app.role() in ('counsellor', 'teacher') and app.office() = p_office)
$$;

create or replace function app.my_student_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from students where user_id = auth.uid()
$$;

-- A parent may see a child only with an active parent_share consent, and for
-- an under-18 child also an active parent_signed_minor consent.
create or replace function app.parent_can_see(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from parents p
    join parent_links l on l.parent_id = p.id and l.student_id = p_student
    join students s on s.id = p_student
    where p.user_id = auth.uid()
      and exists (select 1 from consents c
                  where c.student_id = p_student and c.parent_id = p.id
                    and c.kind = 'parent_share' and c.revoked_at is null)
      and (
        -- unknown age is treated as under 18
        (s.date_of_birth is not null and s.date_of_birth <= (current_date - interval '18 years'))
        or exists (select 1 from consents c
                   where c.student_id = p_student and c.parent_id = p.id
                     and c.kind = 'parent_signed_minor' and c.revoked_at is null)
      )
  )
$$;

create or replace function app.can_see_student(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select app.my_student_id() = p_student
      or app.parent_can_see(p_student)
      or exists (select 1 from students s where s.id = p_student and app.is_staff_of(s.office_id))
$$;

-- ---------------------------------------------------------------
alter table offices          enable row level security;
alter table roles            enable row level security;
alter table users            enable row level security;
alter table students         enable row level security;
alter table parents          enable row level security;
alter table parent_links     enable row level security;
alter table consents         enable row level security;
alter table courses          enable row level security;
alter table batches          enable row level security;
alter table enrolments       enable row level security;
alter table bookings         enable row level security;
alter table classes          enable row level security;
alter table attendance       enable row level security;
alter table homework         enable row level security;
alter table homework_status  enable row level security;
alter table tests            enable row level security;
alter table questions        enable row level security;
alter table submissions      enable row level security;
alter table scores           enable row level security;
alter table reports          enable row level security;
alter table content_entries  enable row level security;
alter table ai_logs          enable row level security;
alter table diagnostics      enable row level security;

-- Public catalogue
create policy offices_read on offices for select using (true);
create policy roles_read on roles for select using (true);
create policy courses_read on courses for select using (active or app.is_admin());
create policy courses_admin on courses for all using (app.is_admin()) with check (app.is_admin());
create policy batches_read on batches for select using (status = 'open' or app.is_staff_of(office_id));
create policy batches_staff on batches for all using (app.is_staff_of(office_id)) with check (app.is_staff_of(office_id));
create policy content_read on content_entries for select using (approved or app.role() in ('admin', 'counsellor', 'teacher'));
create policy content_admin on content_entries for all using (app.is_admin()) with check (app.is_admin());

-- Users
create policy users_self on users for select using (id = auth.uid() or app.is_admin()
  or (office_id is not null and app.is_staff_of(office_id)));
create policy users_admin on users for all using (app.is_admin()) with check (app.is_admin());

-- Students and families
create policy students_read on students for select using (app.can_see_student(id));
create policy students_staff on students for all using (app.is_staff_of(office_id)) with check (app.is_staff_of(office_id));
create policy parents_read on parents for select using (user_id = auth.uid() or app.role() in ('admin', 'counsellor'));
create policy parent_links_read on parent_links for select using (app.can_see_student(student_id));
create policy consents_read on consents for select using (app.can_see_student(student_id));
-- Students grant/revoke their own consent; staff record signed minor forms.
create policy consents_student_write on consents for insert with check (student_id = app.my_student_id() and kind <> 'parent_signed_minor');
create policy consents_student_revoke on consents for update using (student_id = app.my_student_id());
create policy consents_staff on consents for all
  using (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)))
  with check (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)));

-- Enrolment, bookings
create policy enrolments_read on enrolments for select using (app.can_see_student(student_id));
create policy enrolments_staff on enrolments for all
  using (exists (select 1 from batches b where b.id = batch_id and app.is_staff_of(b.office_id)))
  with check (exists (select 1 from batches b where b.id = batch_id and app.is_staff_of(b.office_id)));
create policy bookings_staff on bookings for all using (app.is_staff_of(office_id)) with check (app.is_staff_of(office_id));
create policy bookings_own on bookings for select using (student_id = app.my_student_id());
-- New bookings go through reserve_seat() (security definer) from the server.

-- Classes, attendance, homework
create policy classes_read on classes for select using (
  exists (select 1 from batches b where b.id = batch_id and app.is_staff_of(b.office_id))
  or exists (select 1 from enrolments e where e.batch_id = classes.batch_id and app.can_see_student(e.student_id)));
create policy classes_staff on classes for all
  using (exists (select 1 from batches b where b.id = batch_id and app.is_staff_of(b.office_id)))
  with check (exists (select 1 from batches b where b.id = batch_id and app.is_staff_of(b.office_id)));
create policy attendance_read on attendance for select using (app.can_see_student(student_id));
create policy attendance_teacher on attendance for all
  using (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)))
  with check (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)));
create policy homework_read on homework for select using (true);
create policy homework_staff on homework for all
  using (exists (select 1 from classes c join batches b on b.id = c.batch_id where c.id = class_id and app.is_staff_of(b.office_id)))
  with check (exists (select 1 from classes c join batches b on b.id = c.batch_id where c.id = class_id and app.is_staff_of(b.office_id)));
create policy homework_status_read on homework_status for select using (app.can_see_student(student_id));
create policy homework_status_staff on homework_status for all
  using (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)))
  with check (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)));

-- Tests and questions. Answer keys are only ever read by the server (service role).
create policy tests_read on tests for select using (office_id is null or app.is_staff_of(office_id)
  or office_id = (select office_id from students where id = app.my_student_id()));
create policy tests_staff on tests for all using (app.role() in ('admin', 'teacher')) with check (app.role() in ('admin', 'teacher'));
create policy questions_staff on questions for all using (app.role() in ('admin', 'teacher')) with check (app.role() in ('admin', 'teacher'));
revoke select (answer_key) on questions from anon, authenticated;

-- Submissions and scores
create policy submissions_read on submissions for select using (student_id is not null and app.can_see_student(student_id));
create policy submissions_staff on submissions for update
  using (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)));
-- Students see a mock score only once released; staff always.
create policy scores_read on scores for select using (exists (
  select 1 from submissions sub join students s on s.id = sub.student_id
  where sub.id = submission_id
    and (app.is_staff_of(s.office_id)
         or (sub.status = 'released' and app.can_see_student(sub.student_id)))));
create policy scores_teacher on scores for update using (exists (
  select 1 from submissions sub join students s on s.id = sub.student_id
  where sub.id = submission_id and app.role() in ('admin', 'teacher') and app.is_staff_of(s.office_id)));

-- Reports: students see approved/sent; parents only through parent_can_see.
create policy reports_staff on reports for all
  using (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)))
  with check (exists (select 1 from students s where s.id = student_id and app.is_staff_of(s.office_id)));
create policy reports_student on reports for select using (student_id = app.my_student_id() and status <> 'draft');
create policy reports_parent on reports for select using (status = 'sent' and app.parent_can_see(student_id));

-- Diagnostics
create policy diagnostics_read on diagnostics for select using (student_id is not null and app.can_see_student(student_id));

-- AI logs: admin only (reviewed weekly)
create policy ai_logs_admin on ai_logs for select using (app.is_admin());
