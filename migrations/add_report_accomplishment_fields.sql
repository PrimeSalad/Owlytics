-- Add accomplishment-specific fields to reports table
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS duration  TEXT,
  ADD COLUMN IF NOT EXISTS remarks   TEXT;
