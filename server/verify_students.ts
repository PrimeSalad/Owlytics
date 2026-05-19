import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function verify() {
  // Check students with correct BSI/T pattern
  const { data: bsitStudents } = await supabase
    .from('students')
    .select('student_id, first_name, last_name, section')
    .ilike('section', 'BSI/T%')
    .limit(5);
  
  console.log('👥 BSI/T Students:');
  console.log(bsitStudents);

  const { data: allStudents } = await supabase
    .from('students')
    .select('section');
  
  const courses = new Set(allStudents?.map(s => s.section.split(' ')[0]) || []);
  console.log('\n📚 All Courses Found:');
  console.log(Array.from(courses));
}

verify();
