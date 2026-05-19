import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from server folder
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedStudents() {
  console.log('🚀 Starting student seed...');

  // 1. Get available sections
  const { data: sections, error: secError } = await supabase
    .from('sections')
    .select('id, academic_year, block')
    .eq('is_active', true);

  if (secError || !sections || sections.length === 0) {
    console.error('❌ Error fetching sections or no sections found:', secError);
    return;
  }

  console.log(`📍 Found ${sections.length} sections.`);

  const firstNames = ['Juan', 'Maria', 'Jose', 'Elena', 'Ricardo', 'Liza', 'Antonio', 'Teresa', 'Miguel', 'Carmela', 'Mark', 'John', 'Sarah', 'Jessica', 'David', 'James', 'Robert', 'Michael', 'William', 'Karen'];
  const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Bautista', 'Mendoza', 'Pascual', 'Aquino', 'Villanueva', 'Lim', 'Tan', 'Go', 'Sy', 'Abad', 'Cruz', 'Lopez', 'Hernandez', 'Torres', 'Perez', 'Gonzales'];
  const courses = ['BSIT', 'BSIS'];
  
  const courseNames: Record<string, string> = {
    'BSIT': 'BS Information Technology',
    'BSIS': 'BS Information Systems'
  };

  const students = [];

  for (let i = 0; i < 100; i++) {
    const section = sections[Math.floor(Math.random() * sections.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const studentId = `202${Math.floor(Math.random() * 6)}-${(1000 + i).toString()}`;
    const course = courses[Math.floor(Math.random() * courses.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}${i}@university.edu.ph`;

    students.push({
      student_id: studentId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      section: `${course} ${section.academic_year}-${section.block}`,
      year_level: section.academic_year,
      section_id: section.id
    });
  }

  const { error: insertError } = await supabase
    .from('students')
    .insert(students);

  if (insertError) {
    console.error('❌ Error inserting students:', insertError);
  } else {
    console.log('✅ Successfully added 100 mock students!');
  }
}

seedStudents();
