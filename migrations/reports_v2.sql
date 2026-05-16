-- Reports v2: accomplishment report system
-- Run in Supabase SQL editor

-- 1. Extend reports table
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS activity_id    UUID,
  ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'Submitted'
                                          CHECK (status IN ('Draft','Submitted','Approved','Rejected')),
  ADD COLUMN IF NOT EXISTS rejection_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_by    UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at    TIMESTAMPTZ;

-- 2. Extend report_attachments
ALTER TABLE report_attachments
  ADD COLUMN IF NOT EXISTS caption    TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 3. Accomplishment exports log
CREATE TABLE IF NOT EXISTS accomplishment_exports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  exported_by   UUID NOT NULL REFERENCES profiles(id),
  pdf_url       TEXT,
  is_final      BOOLEAN DEFAULT FALSE,
  section_order JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 5. Ensure report_attachments cascade-deletes with report
ALTER TABLE report_attachments
  DROP CONSTRAINT IF EXISTS report_attachments_report_id_fkey,
  ADD CONSTRAINT report_attachments_report_id_fkey
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;
