-- ============================================================
-- Student Monitoring System — Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
create type user_role as enum ('President','Secretary','Officer','Committee','Attendance');
create type event_status as enum ('Planning','Ongoing','Completed','Cancelled');
create type activity_status as enum ('Pending','InProgress','Done');
create type attendance_status as enum ('Present','Late','Absent');
create type report_type as enum ('Update','Emergency','Accomplishment');
create type session_label as enum ('AM In','AM Out','PM In','PM Out');
create type notification_type as enum ('Emergency','EventUpdate','AttendanceAlert','System');
create type file_type as enum ('image','pdf','document');

-- ── profiles (extends Supabase auth.users) ───────────────────
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  student_id    text unique not null,
  first_name    text not null,
  last_name     text not null,
  role          user_role not null default 'Committee',
  avatar_url    text,
  is_active     boolean not null default true,
  last_login    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── students ─────────────────────────────────────────────────
create table students (
  id              uuid primary key default uuid_generate_v4(),
  student_id      text unique not null,
  first_name      text not null,
  last_name       text not null,
  email           text unique not null,
  section         text not null,
  year_level      smallint not null check (year_level between 1 and 4),
  qr_code_data    text,
  qr_code_url     text,
  import_batch_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── events ───────────────────────────────────────────────────
create table events (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  venue        text,
  start_date   timestamptz not null,
  end_date     timestamptz not null,
  status       event_status not null default 'Planning',
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- event ↔ officer junction
create table event_officers (
  event_id   uuid references events(id) on delete cascade,
  officer_id uuid references profiles(id) on delete cascade,
  primary key (event_id, officer_id)
);

-- ── activities ───────────────────────────────────────────────
create table activities (
  id           uuid primary key default uuid_generate_v4(),
  event_id     uuid not null references events(id) on delete cascade,
  name         text not null,
  description  text,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  committee_id uuid references profiles(id),
  status       activity_status not null default 'Pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── activity_updates ─────────────────────────────────────────
create table activity_updates (
  id           uuid primary key default uuid_generate_v4(),
  activity_id  uuid not null references activities(id) on delete cascade,
  content      text not null,
  submitted_by uuid references profiles(id),
  created_at   timestamptz not null default now()
);

create table activity_update_attachments (
  id        uuid primary key default uuid_generate_v4(),
  update_id uuid not null references activity_updates(id) on delete cascade,
  url       text not null
);

-- ── attendance_schedules ──────────────────────────────────────
create table attendance_schedules (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references events(id) on delete cascade,
  label      text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ── attendance_sessions ───────────────────────────────────────
create table attendance_sessions (
  id                   uuid primary key default uuid_generate_v4(),
  schedule_id          uuid not null references attendance_schedules(id) on delete cascade,
  label                session_label not null,
  open_at              timestamptz not null,
  close_at             timestamptz not null,
  grace_period_minutes smallint not null default 15
);

-- ── attendance_records ────────────────────────────────────────
create table attendance_records (
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

-- ── reports ───────────────────────────────────────────────────
create table reports (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references events(id),
  activity_id uuid references activities(id),
  author_id   uuid not null references profiles(id),
  type        report_type not null,
  title       text not null,
  content     text not null,
  is_resolved boolean not null default false,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table report_attachments (
  id        uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  url       text not null,
  public_id text not null,
  file_type file_type not null
);

-- ── notifications ─────────────────────────────────────────────
create table notifications (
  id           uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type         notification_type not null,
  title        text not null,
  message      text not null,
  related_id   uuid,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────
create index on attendance_records (event_id);
create index on attendance_records (student_id);
create index on activities (event_id);
create index on reports (event_id, type);
create index on notifications (recipient_id, is_read);

-- ── RLS: disable for now (enable per-table when deploying) ────
alter table profiles               enable row level security;
alter table students               enable row level security;
alter table events                 enable row level security;
alter table event_officers         enable row level security;
alter table activities             enable row level security;
alter table activity_updates       enable row level security;
alter table attendance_schedules   enable row level security;
alter table attendance_sessions    enable row level security;
alter table attendance_records     enable row level security;
alter table reports                enable row level security;
alter table notifications          enable row level security;

-- Allow service_role full access (backend uses service_role key — bypasses RLS)
-- Frontend uses anon key — add policies here when ready for production

-- ── Auto-update updated_at ────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated_at    before update on profiles    for each row execute function update_updated_at();
create trigger trg_students_updated_at    before update on students    for each row execute function update_updated_at();
create trigger trg_events_updated_at      before update on events      for each row execute function update_updated_at();
create trigger trg_activities_updated_at  before update on activities  for each row execute function update_updated_at();
create trigger trg_reports_updated_at     before update on reports     for each row execute function update_updated_at();

-- ── Auto-create profile on auth.users insert ─────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, student_id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'student_id', new.id::text),
    coalesce(new.raw_user_meta_data->>'first_name', 'User'),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'Committee')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
