import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debug() {
  // Get courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, course_code')
    .in('course_code', ['BSIS', 'BSI/T']);

  console.log('Courses:', courses);

  const courseIds = courses?.map(c => c.id) || [];
  console.log('Course IDs:', courseIds);

  // Get sections
  const { data: sections } = await supabase
    .from('sections')
    .select('id, academic_year, block, course_id')
    .eq('is_active', true);

  const filteredSections = sections?.filter(s => courseIds.includes(s.course_id)) || [];
  
  console.log('Total sections:', sections?.length);
  console.log('Filtered sections (BSIS + BSI/T):', filteredSections.length);
  
  // Count by course
  const bsisCount = filteredSections.filter(s => {
    const course = courses?.find(c => c.id === s.course_id);
    return course?.course_code === 'BSIS';
  }).length;
  
  const bsitCount = filteredSections.filter(s => {
    const course = courses?.find(c => c.id === s.course_id);
    return course?.course_code === 'BSI/T';
  }).length;

  console.log('BSIS sections:', bsisCount);
  console.log('BSI/T sections:', bsitCount);

  // Sample 10 random picks to see distribution
  console.log('\n10 random section picks:');
  for (let i = 0; i < 10; i++) {
    const section = filteredSections[Math.floor(Math.random() * filteredSections.length)];
    const course = courses?.find(c => c.id === section.course_id);
    console.log(`  ${i+1}. Course: ${course?.course_code}, Section: ${section.academic_year}-${section.block}`);
  }
}

debug();
