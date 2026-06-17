import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export interface ChatMessage {
  id: string;
  body: string;
  kind: 'message' | 'announcement';
  createdAt: string;
  author: {
    id: string;
    name: { first: string; last: string };
    role: string;
    avatarUrl?: string | null;
  } | null;
}

const KEY = ['messages'];

function upsert(prev: ChatMessage[] = [], msg: ChatMessage): ChatMessage[] {
  if (prev.some((m) => m.id === msg.id)) return prev;
  return [...prev, msg];
}

export function useChat() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<ChatMessage[]>('/messages')).data,
    refetchInterval: 20_000, // polling fallback if the socket is unavailable
  });

  // Live updates via socket.
  useEffect(() => {
    const socket = getSocket();
    const onNew = (msg: ChatMessage) => {
      qc.setQueryData<ChatMessage[]>(KEY, (prev) => upsert(prev, msg));
    };
    socket.on('message:new', onNew);
    return () => {
      socket.off('message:new', onNew);
    };
  }, [qc]);

  const send = useMutation({
    mutationFn: async (input: { body: string; kind?: 'message' | 'announcement' }) =>
      (await api.post<ChatMessage>('/messages', input)).data,
    onSuccess: (msg) => {
      qc.setQueryData<ChatMessage[]>(KEY, (prev) => upsert(prev, msg));
    },
  });

  return { ...query, send };
}
