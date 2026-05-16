import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  const { data, error } = await supabase.from('system_logs').select('*');
  console.log('Error:', error);
  console.log('Logs count:', data?.length);
  console.log('First log:', data?.[0]);
}

check();
