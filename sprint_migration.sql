-- Sprint System Migration
-- Run in Supabase SQL Editor

-- 1. Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  goal        text,
  status      text NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'Completed')),
  start_date  date,
  end_date    date,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Add sprint_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES sprints(id) ON DELETE CASCADE;

-- 3. Index for fast task lookup by sprint
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks (sprint_id);

-- 4. Auto-update updated_at
CREATE TRIGGER trg_sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. RLS
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
