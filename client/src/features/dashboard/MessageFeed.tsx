import { Megaphone, ArrowRight } from 'lucide-react';
import { useChat } from '@/features/chat/useChat';

export function MessageFeed() {
  const { data: messages = [] } = useChat();

  // Most recent announcement (messages come back oldest-first).
  const latest = [...messages].reverse().find((m) => m.kind === 'announcement');
  if (!latest) return null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-transparent px-5 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/30">
        <Megaphone className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-[13px] font-semibold text-slate-900">
          <span className="text-amber-700">Announcement</span>
          <span className="ml-2 font-normal text-slate-600">{latest.body}</span>
        </p>
        <p className="mt-0.5 font-sans text-[10px] text-slate-400">
          {latest.author ? `${latest.author.name.first} ${latest.author.name.last}` : 'Admin'} ·{' '}
          {new Date(latest.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-floating-chat'))}
        className="flex shrink-0 items-center gap-1.5 font-sans text-[11px] font-semibold text-amber-600 transition-colors hover:text-amber-700"
      >
        View chat <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
