import { Megaphone, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Notification {
  id: string; type: string; title: string;
  message: string; is_read: boolean; created_at: string;
}

export function MessageFeed() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<Notification[]>('/notifications')).data,
    refetchInterval: 30000,
  });

  const latest = notifications.find((n) => n.type === 'System');
  if (!latest) return null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50/80 to-transparent px-5 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/30">
        <Megaphone className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-[13px] font-semibold text-slate-900">
          {latest.title}
          <span className="ml-2 font-normal text-slate-500">{latest.message}</span>
        </p>
        <p className="mt-0.5 font-sans text-[10px] text-slate-400">
          {new Date(latest.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-floating-chat'))}
        className="flex shrink-0 items-center gap-1.5 font-sans text-[11px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
      >
        View feed <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
