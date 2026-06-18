import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export async function getLogs(_req: Request, res: Response) {
  const { data, error } = await supabase
    .from('system_logs')
    .select('*, actor:profiles(id, first_name, last_name, role)')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new AppError(500, error.message);

  res.json(data);
}
