import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function seedBlocks() {
  console.log('🚀 Seeding all blocks (A-H) for all courses...');

  const { data: courses } = await supabase.from('courses').select('id, course_code');
  if (!courses) return console.error('No courses found');

  const blocks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const years = [1, 2, 3, 4];

  for (const course of courses) {
    console.log(`Processing ${course.course_code}...`);
    const sectionsToInsert = [];

    for (const year of years) {
      for (const block of blocks) {
        sectionsToInsert.push({
          course_id: course.id,
          academic_year: year,
          block: block,
          total_students: 30
        });
      }
    }

    const { error } = await supabase.from('sections').upsert(sectionsToInsert, { 
      onConflict: 'course_id, academic_year, block' 
    });

    if (error) console.error(`Error seeding ${course.course_code}:`, error.message);
    else console.log(`✅ Seeded 32 sections for ${course.course_code}`);
  }

  // Also try to link students again
  console.log('🔗 Re-linking students to section IDs...');
  const { data: students } = await supabase.from('students').select('id, section').is('section_id', null);
  const { data: sectionDetails } = await supabase.from('section_details').select('id, course_code, academic_year, block, display_name');

  if (students && sectionDetails) {
    for (const s of students) {
      const match = sectionDetails.find(sd => 
        s.section === sd.display_name || 
        (s.section.includes(sd.course_code) && s.section.includes(sd.academic_year.toString()) && s.section.endsWith(sd.block))
      );

      if (match) {
        await supabase.from('students').update({ section_id: match.id }).eq('id', s.id);
        console.log(`Matched ${s.section} -> ${match.id}`);
      }
    }
  }

  console.log('✨ All done!');
}

seedBlocks();
