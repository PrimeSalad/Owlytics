-- Task Visibility Migration
-- Run this in Supabase SQL Editor to add role-based visibility to tasks

-- Add visible_to column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visible_to text[] DEFAULT ARRAY['President', 'Secretary', 'Officer', 'Committee', 'Attendance'];

-- Update existing tasks to be visible to all roles by default
UPDATE tasks SET visible_to = ARRAY['President', 'Secretary', 'Officer', 'Committee', 'Attendance'] WHERE visible_to IS NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_visible_to ON tasks USING GIN (visible_to);
