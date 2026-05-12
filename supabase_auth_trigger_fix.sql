-- Supabase Auth profile trigger fix
-- Run this in Supabase SQL Editor if creating an Auth user shows:
-- "Database error creating new user"

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
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
    selected_role,
    true
  )
  on conflict (id) do update set
    student_id = excluded.student_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    role = excluded.role,
    is_active = excluded.is_active,
    updated_at = now();
  return new;
exception
  when unique_violation then
    insert into public.profiles (id, student_id, first_name, last_name, role, is_active)
    values (
      new.id,
      new.id::text,
      coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''), 'User'),
      coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), ''), ''),
      selected_role,
      true
    )
    on conflict (id) do update set
      student_id = excluded.student_id,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      role = excluded.role,
      is_active = excluded.is_active,
      updated_at = now();
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
