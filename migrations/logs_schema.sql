-- ============================================================
-- Student Monitoring System — Logs Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists system_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id) on delete set null,
  action_type text not null, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'AUTH'
  resource text not null,    -- e.g., 'USER', 'TASK', 'EVENT', 'ATTENDANCE'
  details text,              -- human-readable description
  target_id uuid,            -- The UUID of the resource affected (e.g. task id, event id)
  created_at timestamptz not null default now()
);

create index if not exists idx_system_logs_actor on system_logs (actor_id);
create index if not exists idx_system_logs_action on system_logs (action_type);
create index if not exists idx_system_logs_created on system_logs (created_at desc);

-- RLS: Only President can view logs, system service role can insert.
-- We will enable RLS later, but for now, backend service_role bypasses it.
alter table system_logs enable row level security;
