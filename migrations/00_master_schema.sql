-- ============================================================
-- Student Monitoring System (Owlytics) — MASTER SCHEMA
-- ------------------------------------------------------------
-- Run this ONE file in: Supabase Dashboard → SQL Editor → New query.
-- It is idempotent: safe on a fresh project AND safe to re-run on an
-- existing database (it only adds what's missing). It supersedes every
-- other file in /migrations — you do not need to run them separately.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────
do $$ begin create type user_role        as enum ('President','Secretary','Officer','Committee','Attendance'); exception when duplicate_object then null; end $$;
do $$ begin create type event_status     as enum ('Planning','Ongoing','Completed','Cancelled');               exception when duplicate_object then null; end $$;
do $$ begin create type activity_status  as enum ('Pending','InProgress','Done');                              exception when duplicate_object then null; end $$;
do $$ begin create type attendance_status as enum ('Present','Late','Absent');                                 exception when duplicate_object then null; end $$;
do $$ begin create type report_type      as enum ('Update','Emergency','Accomplishment');                      exception when duplicate_object then null; end $$;
do $$ begin create type session_label    as enum ('AM In','AM Out','PM In','PM Out');                          exception when duplicate_object then null; end $$;
do $$ begin create type notification_type as enum ('Emergency','EventUpdate','AttendanceAlert','System');       exception when duplicate_object then null; end $$;
do $$ begin create type file_type        as enum ('image','pdf','document');                                   exception when duplicate_object then null; end $$;
do $$ begin create type block_type       as enum ('A','B','C','D','E','F','G','H');                            exception when duplicate_object then null; end $$;

-- ── Core: profiles (extends auth.users) ──────────────────────
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  student_id       text unique not null,
  first_name       text not null,
  last_name        text not null,
  role             user_role not null default 'Committee',
  avatar_url       text,
  avatar_color     integer not null default 0,
  assigned_section text,
  section_id       uuid,
  contact_number   text,
  department       text,
  bio              text,
  linkedin_url     text,
  is_active        boolean not null default true,
  last_login       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Courses & Sections ───────────────────────────────────────
create table if not exists courses (
  id          uuid primary key default uuid_generate_v4(),
  course_code text unique not null,
  course_name text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists sections (
  id             uuid primary key default uuid_generate_v4(),
  course_id      uuid not null references courses(id) on delete cascade,
  academic_year  smallint not null check (academic_year between 1 and 4),
  block          block_type not null,
  total_students integer default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (course_id, academic_year, block)
);

-- ── Students ─────────────────────────────────────────────────
create table if not exists students (
  id              uuid primary key default uuid_generate_v4(),
  student_id      text unique not null,
  first_name      text not null,
  last_name       text not null,
  email           text unique not null,
  section         text not null,
  section_id      uuid references sections(id) on delete set null,
  year_level      smallint not null check (year_level between 1 and 4),
  qr_code_data    text,
  qr_code_url     text,
  import_batch_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Events / Activities ──────────────────────────────────────
create table if not exists events (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  venue       text,
  start_date  timestamptz not null,
  end_date    timestamptz not null,
  status      event_status not null default 'Planning',
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint events_date_range_valid check (end_date >= start_date)
);

create table if not exists event_officers (
  event_id   uuid references events(id) on delete cascade,
  officer_id uuid references profiles(id) on delete cascade,
  primary key (event_id, officer_id)
);

create table if not exists activities (
  id           uuid primary key default uuid_generate_v4(),
  event_id     uuid not null references events(id) on delete cascade,
  name         text not null,
  description  text,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  committee_id uuid references profiles(id),
  status       activity_status not null default 'Pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint activities_time_range_valid check (end_time >= start_time)
);

create table if not exists activity_updates (
  id           uuid primary key default uuid_generate_v4(),
  activity_id  uuid not null references activities(id) on delete cascade,
  content      text not null,
  submitted_by uuid references profiles(id),
  created_at   timestamptz not null default now()
);

create table if not exists activity_update_attachments (
  id        uuid primary key default uuid_generate_v4(),
  update_id uuid not null references activity_updates(id) on delete cascade,
  url       text not null
);

-- ── Attendance ───────────────────────────────────────────────
create table if not exists attendance_schedules (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references events(id) on delete cascade,
  label      text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists attendance_schedule_scanners (
  schedule_id uuid references attendance_schedules(id) on delete cascade,
  scanner_id  uuid references profiles(id) on delete cascade,
  primary key (schedule_id, scanner_id)
);

create table if not exists attendance_sessions (
  id                   uuid primary key default uuid_generate_v4(),
  schedule_id          uuid not null references attendance_schedules(id) on delete cascade,
  label                session_label not null,
  open_at              timestamptz not null,
  close_at             timestamptz not null,
  grace_period_minutes smallint not null default 15 check (grace_period_minutes >= 0),
  constraint attendance_sessions_time_range_valid check (close_at > open_at)
);

create table if not exists attendance_records (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references events(id),
  schedule_id     uuid not null references attendance_schedules(id),
  session_id      uuid not null references attendance_sessions(id),
  student_id      uuid not null references students(id),
  status          attendance_status not null,
  scanned_by      uuid references profiles(id),
  timestamp       timestamptz not null default now(),
  lat             double precision,
  lng             double precision,
  is_offline_sync boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (student_id, session_id)
);

-- ── Reports ──────────────────────────────────────────────────
create table if not exists reports (
  id             uuid primary key default uuid_generate_v4(),
  event_id       uuid not null references events(id),
  activity_id    uuid references activities(id),
  author_id      uuid not null references profiles(id),
  type           report_type not null,
  title          text not null,
  content        text not null,
  objective      text,
  duration       text,
  remarks        text,
  status         text not null default 'Submitted' check (status in ('Draft','Submitted','Approved','Rejected')),
  rejection_note text,
  approved_by    uuid references profiles(id),
  approved_at    timestamptz,
  submitted_by   uuid references profiles(id),
  created_by     uuid references profiles(id),
  is_resolved    boolean not null default false,
  resolved_by    uuid references profiles(id),
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists report_attachments (
  id         uuid primary key default uuid_generate_v4(),
  report_id  uuid not null references reports(id) on delete cascade,
  url        text not null,
  public_id  text not null,
  file_type  file_type not null,
  caption    text,
  sort_order int default 0
);

create table if not exists accomplishment_exports (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  exported_by   uuid not null references profiles(id),
  pdf_url       text,
  is_final      boolean default false,
  section_order jsonb default '[]',
  created_at    timestamptz default now()
);

-- ── Notifications ────────────────────────────────────────────
create table if not exists notifications (
  id           uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type         notification_type not null,
  title        text not null,
  message      text not null,
  related_id   uuid,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ── Org chat messages ────────────────────────────────────────
create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  author_id  uuid not null references profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  kind       text not null default 'message' check (kind in ('message','announcement')),
  created_at timestamptz not null default now()
);

-- ── Sprints & Tasks ──────────────────────────────────────────
create table if not exists sprints (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  goal       text,
  status     text not null default 'Planning' check (status in ('Planning','Active','Completed')),
  start_date date,
  end_date   date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  status      text not null default 'Todo' check (status in ('Todo','InProgress','Done')),
  sprint_id   uuid references sprints(id) on delete cascade,
  assignees   jsonb not null default '[]',
  visible_to  text[] not null default array['President','Secretary','Officer','Committee','Attendance'],
  created_by  uuid references profiles(id) on delete set null,
  comments    jsonb not null default '[]',
  attachments jsonb not null default '[]',
  viewing_now text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── System logs ──────────────────────────────────────────────
create table if not exists system_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references profiles(id) on delete set null,
  action_type text not null,
  resource    text not null,
  details     text,
  target_id   uuid,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- UPGRADE PATH — add columns/keys missing on older databases.
-- (No-ops on a fresh install created by the statements above.)
-- ============================================================
alter table profiles add column if not exists avatar_color   integer not null default 0;
alter table profiles add column if not exists section_id      uuid;
alter table profiles add column if not exists assigned_section text;
alter table profiles add column if not exists contact_number  text;
alter table profiles add column if not exists department      text;
alter table profiles add column if not exists bio             text;
alter table profiles add column if not exists linkedin_url    text;

alter table students add column if not exists section_id uuid;

alter table reports  add column if not exists activity_id    uuid references activities(id);
alter table reports  add column if not exists objective      text;
alter table reports  add column if not exists duration       text;
alter table reports  add column if not exists remarks        text;
alter table reports  add column if not exists status         text not null default 'Submitted';
alter table reports  add column if not exists rejection_note text;
alter table reports  add column if not exists approved_by    uuid references profiles(id);
alter table reports  add column if not exists approved_at    timestamptz;
alter table reports  add column if not exists submitted_by   uuid references profiles(id);
alter table reports  add column if not exists created_by     uuid references profiles(id);

alter table report_attachments add column if not exists caption    text;
alter table report_attachments add column if not exists sort_order int default 0;

alter table system_logs add column if not exists target_id uuid;

alter table tasks add column if not exists visible_to text[] not null default array['President','Secretary','Officer','Committee','Attendance'];

-- Foreign keys that may be missing on older databases.
do $$ begin
  alter table profiles add constraint profiles_section_id_fkey foreign key (section_id) references sections(id) on delete set null;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin
  alter table students add constraint students_section_id_fkey foreign key (section_id) references sections(id) on delete set null;
exception when duplicate_object then null; when others then null; end $$;

-- report_attachments must cascade-delete with its report.
alter table report_attachments drop constraint if exists report_attachments_report_id_fkey;
alter table report_attachments
  add constraint report_attachments_report_id_fkey
  foreign key (report_id) references reports(id) on delete cascade;

-- The old "Attendance role must have a section" DB constraint caused account
-- creation failures and was removed; the app enforces this at the API layer.
alter table profiles drop constraint if exists check_attendance_has_section;

-- ── Section details view (formatted display name + live count) ─
drop view if exists section_details cascade;
create view section_details as
select
  s.id, s.course_id, c.course_code, c.course_name,
  s.academic_year, s.block,
  (select count(*) from students stu where stu.section_id = s.id) as total_students,
  s.is_active,
  concat(c.course_code, ' ', s.academic_year, '-', s.block) as display_name,
  s.created_at, s.updated_at
from sections s
join courses c on s.course_id = c.id
where s.is_active = true and c.is_active = true;

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_profiles_role_active     on profiles (role, is_active);
create index if not exists idx_profiles_section_id       on profiles (section_id);
create index if not exists idx_profiles_role_section     on profiles (role, section_id);
create index if not exists idx_students_year_section     on students (year_level, section);
create index if not exists idx_students_section_id       on students (section_id);
create index if not exists idx_students_search_trgm      on students using gin ((student_id || ' ' || first_name || ' ' || last_name) gin_trgm_ops);
create index if not exists idx_sections_course_id        on sections (course_id);
create index if not exists idx_sections_academic_year    on sections (academic_year);
create index if not exists idx_sections_is_active        on sections (is_active);
create index if not exists idx_events_status_dates       on events (status, start_date, end_date);
create index if not exists idx_attendance_records_event  on attendance_records (event_id);
create index if not exists idx_attendance_records_student on attendance_records (student_id);
create index if not exists idx_activities_event          on activities (event_id);
create index if not exists idx_reports_event_type        on reports (event_id, type);
create index if not exists idx_notifications_recipient_read on notifications (recipient_id, is_read);
create index if not exists idx_messages_created_at       on messages (created_at desc);
create index if not exists idx_messages_kind_created     on messages (kind, created_at desc);
create index if not exists idx_tasks_sprint_id           on tasks (sprint_id);
create index if not exists idx_tasks_visible_to          on tasks using gin (visible_to);
create index if not exists idx_system_logs_actor         on system_logs (actor_id);
create index if not exists idx_system_logs_action        on system_logs (action_type);
create index if not exists idx_system_logs_created       on system_logs (created_at desc);

-- ── RLS (backend uses the service-role key, which bypasses RLS) ─
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','students','courses','sections','events','event_officers',
    'activities','activity_updates','activity_update_attachments',
    'attendance_schedules','attendance_schedule_scanners','attendance_sessions',
    'attendance_records','reports','report_attachments','accomplishment_exports',
    'notifications','messages','sprints','tasks','system_logs'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- ── Storage bucket for report images ─────────────────────────
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

-- ── updated_at maintenance ───────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','students','events','activities','reports','tasks','sprints'] loop
    execute format('drop trigger if exists trg_%1$s_updated_at on %1$s;', t);
    execute format('create trigger trg_%1$s_updated_at before update on %1$s for each row execute function update_updated_at();', t);
  end loop;
end $$;

-- ── Auto-create a profile when an auth user is created ───────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  requested_student_id text;
  selected_role public.user_role := 'Committee'::public.user_role;
begin
  requested_student_id := nullif(trim(coalesce(new.raw_user_meta_data->>'student_id', '')), '');

  if coalesce(new.raw_user_meta_data->>'role', '') in ('President','Secretary','Officer','Committee','Attendance') then
    selected_role := (new.raw_user_meta_data->>'role')::public.user_role;
  end if;

  insert into public.profiles (id, student_id, first_name, last_name, role, is_active)
  values (
    new.id,
    coalesce(requested_student_id, new.id::text),
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''), 'User'),
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), ''), ''),
    selected_role, true
  )
  on conflict (id) do update set
    student_id = excluded.student_id, first_name = excluded.first_name,
    last_name = excluded.last_name, role = excluded.role,
    is_active = excluded.is_active, updated_at = now();
  return new;
exception
  when unique_violation then
    insert into public.profiles (id, student_id, first_name, last_name, role, is_active)
    values (
      new.id, new.id::text,
      coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''), 'User'),
      coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), ''), ''),
      selected_role, true
    )
    on conflict (id) do update set
      student_id = excluded.student_id, first_name = excluded.first_name,
      last_name = excluded.last_name, role = excluded.role,
      is_active = excluded.is_active, updated_at = now();
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Seed courses + sections (non-destructive) ────────────────
insert into courses (course_code, course_name) values
  ('BSI/T', 'BS Information Technology'),
  ('BSIS',  'BS Information Systems')
on conflict (course_code) do update set course_name = excluded.course_name;

-- Blocks are derived from the enum itself, so this works whether the
-- block_type enum has A–G or A–H (no hard-coded value that could be missing).
insert into sections (course_id, academic_year, block)
select c.id, y.val::smallint, b.val
from courses c
cross join generate_series(1, 4) as y(val)
cross join (select unnest(enum_range(null::block_type)) as val) as b
where c.course_code in ('BSI/T', 'BSIS')
on conflict do nothing;

-- Reload PostgREST schema cache so new tables/columns are visible immediately.
notify pgrst, 'reload schema';

-- ============================================================
-- Bootstrap the first admin:
--   Supabase → Authentication → Add user, then set raw_user_meta_data:
--   {"student_id":"ADMIN-001","first_name":"Admin","last_name":"President","role":"President"}
-- Then use the in-app People page to create the rest of the accounts.
-- ============================================================
