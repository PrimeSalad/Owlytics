-- ============================================================
-- REFINEMENT: BSIT/BSIS Only & Dynamic Student Count
-- ============================================================

-- 1. Remove other courses and add BSIS
DELETE FROM courses WHERE course_code NOT IN ('BSIT', 'BSIS', 'IT', 'IS');

-- Update IT to BSIT and IS to BSIS if they exist with old codes
UPDATE courses SET course_code = 'BSIT' WHERE course_code = 'IT';
UPDATE courses SET course_code = 'BSIS' WHERE course_code = 'IS';

INSERT INTO courses (course_code, course_name)
VALUES 
  ('BSIT', 'BS Information Technology'),
  ('BSIS', 'BS Information Systems')
ON CONFLICT (course_code) DO UPDATE SET course_name = excluded.course_name;

-- 2. Ensure sections exist (Blocks A-H, Years 1-4)
INSERT INTO sections (course_id, academic_year, block)
SELECT c.id, year.val, block.val
FROM courses c
CROSS JOIN (SELECT 1 AS val UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) AS year(val)
CROSS JOIN (SELECT 'A'::block_type AS val UNION SELECT 'B'::block_type UNION SELECT 'C' 
            UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H') AS block(val)
WHERE c.course_code IN ('BSIT', 'BSIS')
ON CONFLICT DO NOTHING;

-- 3. Update the view to calculate students dynamically from the students table
-- We DROP it first because COUNT(*) returns bigint, and the old view had integer
DROP VIEW IF EXISTS section_details CASCADE;

CREATE OR REPLACE VIEW section_details AS
SELECT
  s.id,
  s.course_id,
  c.course_code,
  c.course_name,
  s.academic_year,
  s.block,
  -- Dynamic count from students table:
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
