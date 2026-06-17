import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

const createMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000),
  kind: z.enum(['message', 'announcement']).default('message'),
});

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
};

const MISSING_TABLE = (err: { code?: string; message?: string }) =>
  err.code === 'PGRST205' || err.code === '42P01' || /relation .*messages.* does not exist/i.test(err.message ?? '');

function shapeMessage(row: any, author?: ProfileRow) {
  return {
    id: row.id,
    body: row.body,
    kind: row.kind,
    createdAt: row.created_at,
    author: author
      ? {
          id: author.id,
          name: { first: author.first_name, last: author.last_name },
          role: author.role,
          avatarUrl: author.avatar_url,
        }
      : null,
  };
}

async function authorMap(authorIds: string[]): Promise<Map<string, ProfileRow>> {
  const ids = [...new Set(authorIds)];
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, avatar_url')
    .in('id', ids);
  return new Map((data ?? []).map((p: any) => [p.id, p as ProfileRow]));
}

export async function listMessages(_req: Request, res: Response) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, body, kind, created_at, author_id')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (MISSING_TABLE(error)) throw new AppError(503, 'Chat is not set up yet — run migrations/chat_messages.sql in Supabase.');
    throw new AppError(500, error.message);
  }

  const rows = (data ?? []).slice().reverse(); // oldest first for chat rendering
  const authors = await authorMap(rows.map((r) => r.author_id));
  res.json(rows.map((r) => shapeMessage(r, authors.get(r.author_id))));
}

export async function createMessage(req: Request, res: Response) {
  const { body, kind } = createMessageSchema.parse(req.body);

  if (kind === 'announcement' && !['President', 'Secretary'].includes(req.user!.role)) {
    throw new AppError(403, 'Only the President or Secretary can post announcements');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ author_id: req.user!.userId, body, kind })
    .select('id, body, kind, created_at, author_id')
    .single();

  if (error) {
    if (MISSING_TABLE(error)) throw new AppError(503, 'Chat is not set up yet — run migrations/chat_messages.sql in Supabase.');
    throw new AppError(400, error.message);
  }

  const authors = await authorMap([data.author_id]);
  const message = shapeMessage(data, authors.get(data.author_id));

  // Real-time fan-out to every connected client.
  req.app.locals.io?.emit('message:new', message);

  res.status(201).json(message);
}
