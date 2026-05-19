import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  // Check courses
  const { data: courses } = await supabase.from('courses').select('id, course_code, course_name');
  console.log('📚 Available Courses:');
  console.log(courses);

  // Check students grouped by section
  const { data: allStudents } = await supabase
    .from('students')
    .select('section, id');
  
  console.log('\n📊 Total Students:', allStudents?.length);
  
  const grouped = (allStudents || []).reduce((acc: any, s: any) => {
    const coursePart = s.section.split(' ')[0];
    acc[coursePart] = (acc[coursePart] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Students by Course:');
  console.log(grouped);

  // Sample students from each course
  const { data: bsisStudents } = await supabase
    .from('students')
    .select('student_id, first_name, last_name, section')
    .ilike('section', 'BSIS%')
    .limit(3);
  
  console.log('\n👥 Sample BSIS Students:');
  console.log(bsisStudents);

  const { data: bsitStudents } = await supabase
    .from('students')
    .select('student_id, first_name, last_name, section')
    .ilike('section', 'BSIT%')
    .limit(3);
  
  console.log('\n👥 Sample BSIT Students:');
  console.log(bsitStudents);
}

check();
