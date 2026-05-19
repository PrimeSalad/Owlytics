import { supabase } from './src/config/supabase';

async function check() {
  const { data, error } = await supabase.from('section_details').select('*').limit(1);
  console.log(error || data);
}
check();