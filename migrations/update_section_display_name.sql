-- Update section_details view to match requested simpler display format: "CourseCode Year-Block"
create or replace view section_details as
select
  s.id,
  s.course_id,
  c.course_code,
  c.course_name,
  s.academic_year,
  s.block,
  s.total_students,
  s.is_active,
  concat(
    c.course_code, 
    ' ', 
    s.academic_year,
    '-',
    s.block
  ) as display_name,
  s.created_at,
  s.updated_at
from sections s
join courses c on s.course_id = c.id
where s.is_active = true and c.is_active = true;
