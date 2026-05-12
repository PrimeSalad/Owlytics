-- Sprint System Migration
-- Run in Supabase SQL Editor

-- 1. Create tasks table (if it doesn't exist yet)
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'InProgress', 'Done')),
  sprint_id   uuid,  -- FK added below after sprints table exists
  assignees   jsonb NOT NULL DEFAULT '[]',
  visible_to  text[] NOT NULL DEFAULT ARRAY['President', 'Secretary', 'Officer', 'Committee', 'Attendance'],
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  comments    jsonb NOT NULL DEFAULT '[]',
  attachments jsonb NOT NULL DEFAULT '[]',
  viewing_now text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Create sprints table
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

-- 3. Add sprint_id FK to tasks (safe to run multiple times)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id_new uuid REFERENCES sprints(id) ON DELETE CASCADE;

-- If sprint_id column already exists without FK, migrate it
DO $$
BEGIN
  -- Check if sprint_id column exists but sprint_id_new was just added
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint_id'
    AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint_id_new'
    AND table_schema = 'public'
  ) THEN
    -- Copy data from old column to new
    UPDATE tasks SET sprint_id_new = sprint_id::uuid WHERE sprint_id IS NOT NULL;
    ALTER TABLE tasks DROP COLUMN sprint_id;
    ALTER TABLE tasks RENAME COLUMN sprint_id_new TO sprint_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint_id_new'
    AND table_schema = 'public'
  ) THEN
    -- No old sprint_id column, just rename
    ALTER TABLE tasks RENAME COLUMN sprint_id_new TO sprint_id;
  END IF;
END $$;

-- 4. Add visible_to column if missing
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visible_to text[] NOT NULL DEFAULT ARRAY['President', 'Secretary', 'Officer', 'Committee', 'Attendance'];

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks (sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_visible_to ON tasks USING GIN (visible_to);

-- 6. Auto-update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sprints_updated_at ON sprints;
CREATE TRIGGER trg_sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. RLS (service_role key used by backend bypasses RLS automatically)
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
