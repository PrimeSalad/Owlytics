import { useState, useRef, useEffect } from 'react';
import { Megaphone, Send, X, MessageCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useChat, type ChatMessage } from '@/features/chat/useChat';

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500',
  'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-indigo-500',
];

function initials(m: ChatMessage) {
  const f = m.author?.name.first?.[0] ?? '?';
  const l = m.author?.name.last?.[0] ?? '';
  return (f + l).toUpperCase();
}
function colorFor(id?: string) {
  if (!id) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function FloatingChat() {
  const { user } = useAuthStore();
  const { data: messages = [], send } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'message' | 'announcement'>('message');
  const [lastSeen, setLastSeen] = useState<number>(() => Number(localStorage.getItem('chat_last_seen') || 0));

  const scrollRef = useRef<HTMLDivElement>(null);
  const canAnnounce = user?.role === 'President' || user?.role === 'Secretary';

  const unread = messages.filter(
    (m) => new Date(m.createdAt).getTime() > lastSeen && m.author?.id !== user?._id,
  ).length;

  // Allow other components (e.g. the dashboard banner) to open the chat.
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('open-floating-chat', open);
    return () => window.removeEventListener('open-floating-chat', open);
  }, []);

  // Keep scrolled to the latest and mark everything seen while open.
  useEffect(() => {
    if (!isOpen) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    const now = Date.now();
    setLastSeen(now);
    localStorage.setItem('chat_last_seen', String(now));
  }, [isOpen, messages.length]);

  const handleSend = () => {
    const body = text.trim();
    if (!body || send.isPending) return;
    send.mutate(
      { body, kind: mode },
      { onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to send message') },
    );
    setText('');
    if (mode === 'announcement') setMode('message');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="flex h-[560px] max-h-[calc(100dvh-7.5rem)] w-[calc(100vw-3rem)] max-w-[340px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:w-[400px] sm:max-w-[400px]">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Org Chat</p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-brand-100">Everyone in your org</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-2 transition hover:bg-white/20" aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <div className="mb-3 rounded-full bg-slate-100 p-4">
                  <MessageCircle className="h-7 w-7 opacity-30" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No messages yet</p>
                <p className="mt-1 max-w-[200px] text-xs text-slate-400">Say hello — your message is shared with the whole org.</p>
              </div>
            ) : (
              messages.map((m, i) => {
                const mine = m.author?.id === user?._id;
                const prev = messages[i - 1];
                const grouped = prev && prev.author?.id === m.author?.id && prev.kind === m.kind;

                if (m.kind === 'announcement') {
                  return (
                    <div key={m.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 shadow-sm">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Megaphone className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Announcement</span>
                        <span className="ml-auto text-[10px] text-amber-600">{fmtTime(m.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-amber-900">{m.body}</p>
                      <p className="mt-1.5 text-[10px] font-medium text-amber-600">
                        — {m.author ? `${m.author.name.first} ${m.author.name.last}` : 'Admin'} · {m.author?.role}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className={cn('flex items-end gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
                    {!mine && (
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', grouped ? 'opacity-0' : colorFor(m.author?.id))}>
                        {initials(m)}
                      </div>
                    )}
                    <div className={cn('max-w-[75%]', mine ? 'items-end' : 'items-start')}>
                      {!mine && !grouped && (
                        <p className="mb-0.5 ml-1 text-[11px] font-semibold text-slate-600">
                          {m.author ? `${m.author.name.first} ${m.author.name.last}` : 'Unknown'}
                          <span className="ml-1.5 font-normal text-slate-400">{m.author?.role}</span>
                        </p>
                      )}
                      <div
                        className={cn(
                          'rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm',
                          mine
                            ? 'rounded-br-md bg-brand-600 text-white'
                            : 'rounded-bl-md border border-slate-100 bg-white text-slate-700',
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      </div>
                      <p className={cn('mt-0.5 text-[10px] text-slate-400', mine ? 'text-right mr-1' : 'ml-1')}>{fmtTime(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-slate-100 bg-white p-3">
            {canAnnounce && (
              <div className="mb-2 flex items-center gap-1.5">
                <button
                  onClick={() => setMode('message')}
                  className={cn('rounded-full px-3 py-1 text-[11px] font-semibold transition', mode === 'message' ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:text-slate-600')}
                >
                  Message
                </button>
                <button
                  onClick={() => setMode('announcement')}
                  className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition', mode === 'announcement' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-slate-600')}
                >
                  <Megaphone className="h-3 w-3" /> Announcement
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={mode === 'announcement' ? 'Write an announcement…' : 'Type a message…'}
                className={cn(
                  'max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl border bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2',
                  mode === 'announcement'
                    ? 'border-amber-200 focus:border-amber-400 focus:ring-amber-400/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20',
                )}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || send.isPending}
                className={cn(
                  'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl text-white shadow-sm transition disabled:opacity-40',
                  mode === 'announcement' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-600 hover:bg-brand-700',
                )}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95',
          isOpen ? 'bg-brand-700' : 'bg-brand-600 hover:bg-brand-700',
        )}
        aria-label="Toggle chat"
      >
        {isOpen ? <X className="h-7 w-7 text-white" /> : <MessageCircle className="h-7 w-7 text-white" />}
        {!isOpen && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white ring-4 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
