-- Run this to update your existing system_logs table
alter table system_logs add column if not exists target_id uuid;
