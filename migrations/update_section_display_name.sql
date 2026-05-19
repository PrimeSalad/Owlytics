-- Update section_details view to match requested "smart" display format
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
    c.course_name, 
    ' - ', 
    case 
      when s.academic_year = 1 then '1st Year'
      when s.academic_year = 2 then '2nd Year'
      when s.academic_year = 3 then '3rd Year'
      when s.academic_year = 4 then '4th Year'
      else s.academic_year || 'th Year'
    end,
    ' - ',
    s.academic_year,
    '-',
    s.block
  ) as display_name,
  s.created_at,
  s.updated_at
from sections s
join courses c on s.course_id = c.id
where s.is_active = true and c.is_active = true;
