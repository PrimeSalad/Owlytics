-- ============================================================
-- Add two new roles: Vice President and Adviser
-- ------------------------------------------------------------
-- Run in: Supabase Dashboard → SQL Editor → New query.
-- Idempotent and safe to re-run.
--
-- Permission model (enforced in the app/API layer):
--   • Adviser        inherits ALL permissions of President
--   • VicePresident  inherits ALL permissions of Secretary
--
-- NOTE: If Supabase complains with "unsafe use of new value ... of enum
-- type user_role", run ONLY the two `alter type` lines below first (as their
-- own query), then run the rest. New enum values can't be USED in the same
-- transaction they're added in — but nothing below actually uses them at
-- run time during this script, so a single run normally works.
-- ============================================================

-- ── 1. Extend the enum ───────────────────────────────────────
alter type user_role add value if not exists 'VicePresident';
alter type user_role add value if not exists 'Adviser';

-- ── 2. Allow the new roles when an auth user is created ──────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  requested_student_id text;
  selected_role public.user_role := 'Committee'::public.user_role;
begin
  requested_student_id := nullif(trim(coalesce(new.raw_user_meta_data->>'student_id', '')), '');

  if coalesce(new.raw_user_meta_data->>'role', '') in
     ('President','Secretary','Officer','Committee','Attendance','VicePresident','Adviser') then
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

-- ── 3. Make new roles visible to tasks by default ────────────
alter table tasks
  alter column visible_to
  set default array['President','Secretary','Officer','Committee','Attendance','VicePresident','Adviser'];

-- Reload PostgREST schema cache so the new enum values are visible immediately.
notify pgrst, 'reload schema';
