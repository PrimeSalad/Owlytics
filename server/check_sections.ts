import { supabase } from './src/config/supabase';

async function check() {
  const { data, error } = await supabase.from('courses').select('*').limit(1);
  console.log('Courses:', error ? error.message : data);
  
  const { data: pData, error: pError } = await supabase.from('profiles').select('section_id').limit(1);
  console.log('Profiles section_id:', pError ? pError.message : 'Exists');
}
check();