-- ============================================================
-- CHANGE: BSIT to BSI/T
-- ============================================================

-- 1. Update courses table
UPDATE courses SET course_code = 'BSI/T' WHERE course_code = 'BSIT';

-- 2. Update existing students' section text (e.g. BSIT 4-G -> BSI/T 4-G)
UPDATE students 
SET section = REPLACE(section, 'BSIT', 'BSI/T')
WHERE section LIKE 'BSIT%';

-- 3. Recreate the view to use the new code and format
DROP VIEW IF EXISTS section_details CASCADE;

CREATE OR REPLACE VIEW section_details AS
SELECT
  s.id,
  s.course_id,
  c.course_code,
  c.course_name,
  s.academic_year,
  s.block,
  (SELECT COUNT(*) FROM students stu WHERE stu.section_id = s.id) as total_students,
  s.is_active,
  CONCAT(c.course_code, ' ', s.academic_year, '-', s.block) as display_name,
  s.created_at,
  s.updated_at
FROM sections s
JOIN courses c ON s.course_id = c.id
WHERE s.is_active = true AND c.is_active = true;

-- 4. Refresh schema
NOTIFY pgrst, 'reload schema';
