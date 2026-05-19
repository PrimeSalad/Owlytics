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

  // 1. Delete existing students first
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('⚠️ Warning: Could not delete existing students:', deleteError.message);
  } else {
    console.log('🗑️ Cleared existing mock students');
  }

  // 2. Get available sections
  const { data: sections, error: secError } = await supabase
    .from('sections')
    .select('id, academic_year, block, course_id')
    .eq('is_active', true);

  if (secError || !sections || sections.length === 0) {
    console.error('❌ Error fetching sections or no sections found:', secError);
    return;
  }

  console.log(`📍 Found ${sections.length} sections.`);

  // Get courses to filter by BSIS and BSIT
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, course_code')
    .in('course_code', ['BSIS', 'BSIT']);

  if (courseError || !courses || courses.length === 0) {
    console.error('❌ Error fetching courses:', courseError);
    return;
  }

  const courseIds = courses.map(c => c.id);
  const filteredSections = sections.filter(s => courseIds.includes(s.course_id));

  if (filteredSections.length === 0) {
    console.error('❌ No sections found for BSIS and BSIT courses');
    return;
  }

  console.log(`📍 Found ${filteredSections.length} BSIS/BSIT sections.`);

  const firstNames = ['Juan', 'Maria', 'Jose', 'Elena', 'Ricardo', 'Liza', 'Antonio', 'Teresa', 'Miguel', 'Carmela', 'Mark', 'John', 'Sarah', 'Jessica', 'David', 'James', 'Robert', 'Michael', 'William', 'Karen'];
  const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Bautista', 'Mendoza', 'Pascual', 'Aquino', 'Villanueva', 'Lim', 'Tan', 'Go', 'Sy', 'Abad', 'Cruz', 'Lopez', 'Hernandez', 'Torres', 'Perez', 'Gonzales'];
  const enrollmentYears = ['22', '23', '24']; // Years entered school (2022, 2023, 2024)

  const students = [];
  let studentCounter = 1;

  for (let i = 0; i < 150; i++) {
    const section = filteredSections[Math.floor(Math.random() * filteredSections.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const enrollmentYear = enrollmentYears[Math.floor(Math.random() * enrollmentYears.length)];
    const courseCode = courses.find(c => courseIds.includes(section.course_id))?.course_code || 'BSIT';
    
    // Generate student ID in format: 22B0940 (year + letter + numbers)
    const blockLetter = section.block; // A-H
    const studentNumber = String(studentCounter).padStart(4, '0');
    const studentId = `${enrollmentYear}${blockLetter}${studentNumber}`;
    studentCounter++;

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}${i}@university.edu.ph`;

    students.push({
      student_id: studentId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      section: `${courseCode} ${section.academic_year}-${section.block}`,
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
    console.log(`✅ Successfully added ${students.length} mock students with new ID format!`);
    console.log('   Sample ID format: 22B0940 (enrollment year + section letter + sequence)');
  }
}

seedStudents();
