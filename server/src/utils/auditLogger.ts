import { supabase } from '../config/supabase';
import { logger } from './logger';

export async function logAction(
  actorId: string,
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH' | 'SYSTEM',
  resource: string,
  details: string
) {
  try {
    const { error } = await supabase.from('system_logs').insert({
      actor_id: actorId,
      action_type: actionType,
      resource: resource,
      details: details,
    });

    if (error) {
      logger.error('Failed to insert system log', { error: error.message });
    }
  } catch (err) {
    logger.error('Exception during logAction', err);
  }
}
