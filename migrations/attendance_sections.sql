-- ============================================================
-- Attendance Sections Schema Migration
-- Implements section-based attendance management
-- ============================================================

-- ── Create sections enum for blocks ──────────────────────────
do $$
begin
  create type block_type as enum ('A', 'B', 'C', 'D', 'E', 'F', 'G');
exception when duplicate_object then null;
end $$;

-- ── Create courses table (if not exists) ─────────────────────
create table if not exists courses (
  id              uuid primary key default uuid_generate_v4(),
  course_code     text unique not null,
  course_name     text not null,
  description     text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Create sections table ────────────────────────────────────
create table if not exists sections (
  id              uuid primary key default uuid_generate_v4(),
  course_id       uuid not null references courses(id) on delete cascade,
  academic_year   smallint not null check (academic_year between 1 and 4),
  block           block_type not null,
  total_students  integer default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(course_id, academic_year, block)
);

-- ── Add section_id to profiles table ─────────────────────────
alter table profiles add column if not exists section_id uuid references sections(id) on delete set null;

-- ── Create indexes for performance ───────────────────────────
create index if not exists idx_sections_course_id on sections(course_id);
create index if not exists idx_sections_academic_year on sections(academic_year);
create index if not exists idx_sections_is_active on sections(is_active);
create index if not exists idx_profiles_section_id on profiles(section_id);
create index if not exists idx_profiles_role_section on profiles(role, section_id);

-- ── Add constraint: Attendance role must have section ────────
alter table profiles add constraint check_attendance_has_section
check (
  (role != 'Attendance'::user_role) or (section_id is not null)
);

-- ── Create view for section details ──────────────────────────
create or replace view section_details as
select
  s.id,
  s.course_id,
  c.course_code,
  c.course_name,
  s.academic_year,
  s.block,
  s.total_students,
  s.is_active,
  concat(c.course_name, ' - Year ', s.academic_year, ' - Block ', s.block) as display_name,
  s.created_at,
  s.updated_at
from sections s
join courses c on s.course_id = c.id
where s.is_active = true and c.is_active = true;

-- ── Seed sample courses (optional) ───────────────────────────
insert into courses (course_code, course_name) values
  ('CS', 'BS Computer Science'),
  ('IT', 'BS Information Technology'),
  ('SE', 'BS Software Engineering'),
  ('AI', 'BS Artificial Intelligence')
on conflict do nothing;

-- ── Seed sample sections (optional) ──────────────────────────
insert into sections (course_id, academic_year, block, total_students) 
select c.id, year.val, block.val, 30
from courses c
cross join (select 1 as val union select 2 union select 3 union select 4) as year(val)
cross join (select 'A'::block_type as val union select 'B'::block_type) as block(val)
where c.course_code in ('CS', 'IT')
on conflict do nothing;

-- ============================================================
-- Rollback commands (if needed):
-- alter table profiles drop constraint if exists check_attendance_has_section;
-- alter table profiles drop column if exists section_id;
-- drop view if exists section_details;
-- drop table if exists sections;
-- drop table if exists courses;
-- drop type if exists block_type;
-- ============================================================
