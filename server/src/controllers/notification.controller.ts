import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

function buildMockNotifications(recipientId: string) {
  const now = Date.now();
  return [
    {
      id: `mock-${recipientId}-1`,
      recipient_id: recipientId,
      type: 'System',
      title: 'Welcome to Owlytics',
      message: 'This is a mock announcement to validate the notifications UI.',
      is_read: false,
      created_at: new Date(now - 5 * 60 * 1000).toISOString(),
    },
    {
      id: `mock-${recipientId}-2`,
      recipient_id: recipientId,
      type: 'EventUpdate',
      title: 'Event Reminder',
      message: 'General assembly starts in 30 minutes at the covered court.',
      is_read: false,
      created_at: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: `mock-${recipientId}-3`,
      recipient_id: recipientId,
      type: 'AttendanceAlert',
      title: 'Attendance Checkpoint',
      message: 'QR attendance checkpoint has been opened for this session.',
      is_read: true,
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function getNotifications(req: Request, res: Response) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', req.user!.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  const useMock = env.NODE_ENV !== 'production' || req.query.mock === '1';

  if (error) {
    if (useMock) {
      return res.json(buildMockNotifications(req.user!.userId));
    }
    throw new AppError(500, error.message);
  }

  if (useMock && (!data || data.length === 0)) {
    return res.json(buildMockNotifications(req.user!.userId));
  }

  return res.json(data);
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
