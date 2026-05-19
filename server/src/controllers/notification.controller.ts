import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export async function getNotifications(req: Request, res: Response) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', req.user!.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new AppError(500, error.message);
  }

  return res.json(data || []);
}

export async function markAsRead(req: Request, res: Response) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('recipient_id', req.user!.userId);

  if (error) throw new AppError(500, error.message);
  res.json({ message: 'Marked as read' });
}

export async function broadcastAnnouncement(req: Request, res: Response) {
  const { title, message } = req.body;
  if (!title || !message) throw new AppError(400, 'Title and message required');

  // Get all active users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_active', true);

  if (usersError) throw new AppError(500, usersError.message);

  if (users.length > 0) {
    const notifications = users.map((u) => ({
      recipient_id: u.id,
      type: 'System', // use System for announcements
      title,
      message,
    }));

    const { error: insertError } = await supabase.from('notifications').insert(notifications);
    if (insertError) throw new AppError(500, insertError.message);
  }

  res.json({ message: 'Announcement broadcasted successfully' });
}
