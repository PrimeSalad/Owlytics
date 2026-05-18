-- ============================================================
-- EMERGENCY FIX: Remove strict constraint temporarily
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Tanggalin muna ang mahigpit na batas (Constraint)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_attendance_has_section;

-- 2. Siguraduhin na nandyan ang mga columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='section_id') THEN
        ALTER TABLE profiles ADD COLUMN section_id uuid REFERENCES sections(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. I-refresh ang system cache
NOTIFY pgrst, 'reload schema';
