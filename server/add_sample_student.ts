import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: sections } = await supabase.from('sections').select('id, academic_year, block').limit(1);
  if (!sections || sections.length === 0) {
    console.error('No sections found to link student to.');
    return;
  }
  const s = sections[0];
  
  const { error } = await supabase.from('students').insert([{
    student_id: '2026-TEST',
    first_name: 'Sample',
    last_name: 'Student',
    email: 'sample.student@university.edu.ph',
    section: 'BSI/T ' + s.academic_year + '-' + s.block,
    year_level: s.academic_year,
    section_id: s.id
  }]);

  if (error) {
    console.error('Error adding sample student:', error);
  } else {
    console.log('✅ Added Sample Student: Sample Student (2026-TEST)');
  }
}
run();
