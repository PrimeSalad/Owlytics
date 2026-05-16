import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export async function getLogs(req: Request, res: Response) {
  console.log('[API] GET /logs hit by user:', req.user?.userId);
  const { data, error } = await supabase
    .from('system_logs')
    .select('*, actor:profiles(id, first_name, last_name, role)')
    .order('created_at', { ascending: false })
    .limit(500); // Reasonable limit for now

  if (error) {
    console.error('[API] GET /logs error:', error);
    throw new AppError(500, error.message);
  }

  console.log('[API] GET /logs returning rows:', data?.length);
  res.json(data);
}
