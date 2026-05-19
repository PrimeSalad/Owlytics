import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  // Check sections with course info
  const { data: sections } = await supabase
    .from('sections')
    .select('id, academic_year, block, course_id, courses(course_code)')
    .eq('is_active', true);
  
  console.log('📋 Sections by Course:');
  const grouped = (sections || []).reduce((acc: any, s: any) => {
    const courseCode = s.courses?.course_code || 'unknown';
    acc[courseCode] = (acc[courseCode] || 0) + 1;
    return acc;
  }, {});
  console.log(grouped);
  
  // Sample sections from each course
  const bsisSections = sections?.filter(s => s.courses?.course_code === 'BSIS');
  const bsitSections = sections?.filter(s => s.courses?.course_code === 'BSI/T');
  
  console.log('\nBSIS Sections:', bsisSections?.length);
  console.log('BSI/T Sections:', bsitSections?.length);
}

check();
