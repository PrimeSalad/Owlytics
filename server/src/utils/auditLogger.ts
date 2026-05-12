import { supabase } from '../config/supabase';
import { logger } from './logger';

export async function logAction(
  actorId: string,
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH' | 'SYSTEM',
  resource: string,
  details: string,
  targetId?: string
) {
  try {
    const payload: any = {
      actor_id: actorId,
      action_type: actionType,
      resource: resource,
      details: details,
    };
    if (targetId) {
      payload.target_id = targetId;
    }
    const { error } = await supabase.from('system_logs').insert(payload);

    if (error) {
      logger.error('Failed to insert system log', { error: error.message });
    }
  } catch (err) {
    logger.error('Exception during logAction', err);
  }
}
