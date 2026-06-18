import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Menu, X, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn, roleLabel, AVATAR_COLORS } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NavbarProps { onMenuClick: () => void; title?: string; }
interface Notification {
  id: string; type: string; title: string;
  message: string; is_read: boolean; created_at: string;
}

const rolePill: Record<string, string> = {
  President:  'bg-brand-100 text-brand-700',
  Secretary:  'bg-blue-100 text-blue-700',
  Officer:    'bg-amber-100 text-amber-700',
  Committee:  'bg-slate-100 text-slate-600',
  Attendance: 'bg-emerald-100 text-emerald-700',
};

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<Notification[]>('/notifications')).data,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm md:px-6">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="font-display text-[16px] font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">

        {/* Bell */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-danger-500 px-0.5 text-[8px] font-bold text-white ring-2 ring-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-[340px] animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <div>
                  <p className="font-display text-[14px] font-semibold text-slate-900">Notifications</p>
                  <p className="text-[11px] text-slate-400">{unread} unread</p>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-[13px] text-slate-300">No notifications yet</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <li key={n.id} className={cn('flex gap-3 px-5 py-4 transition-colors hover:bg-slate-50', !n.is_read && 'bg-brand-50/40')}>
                        <div className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', n.is_read ? 'bg-slate-200' : 'bg-brand-500')} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-slate-800">{n.title}</p>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{n.message}</p>
                          <p className="mt-1.5 text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id); }}
                            className="shrink-0 self-start rounded-lg p-1 text-slate-300 transition-colors hover:bg-brand-50 hover:text-brand-600"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* User */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-slate-50 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white overflow-hidden', !user.avatarUrl ? `bg-gradient-to-br ${AVATAR_COLORS[user.avatarColor || 0]?.from} ${AVATAR_COLORS[user.avatarColor || 0]?.to}` : 'ring-1 ring-slate-200')}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <>{user.name.first[0]}{user.name.last[0]}</>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-[13px] font-semibold leading-none text-slate-800">
                  {user.name.first} {user.name.last}
                </p>
                <span className={cn(
                  'mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none',
                  rolePill[user.role] ?? 'bg-slate-100 text-slate-600',
                )}>
                  {roleLabel(user.role)}
                </span>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
                <div className="border-b border-slate-100 px-4 py-3 md:hidden">
                  <p className="text-sm font-semibold text-slate-800">
                    {user.name.first} {user.name.last}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Profile & Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 transition hover:bg-danger-50"
                  >
                    <LogOut className="h-4 w-4 text-danger-400" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
