import { Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
}

const rolePill: Record<string, string> = {
  President:  'bg-brand-100 text-brand-700',
  Secretary:  'bg-blue-100 text-blue-700',
  Officer:    'bg-amber-100 text-amber-700',
  Committee:  'bg-slate-100 text-slate-600',
  Attendance: 'bg-emerald-100 text-emerald-700',
};

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-4 md:px-6 shadow-sm sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors md:hidden focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="font-display text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-slate-200" />

        {/* Avatar + info */}
        {user && (
          <div className="flex items-center gap-3 cursor-pointer p-1 pr-2 rounded-full hover:bg-slate-50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-sm font-bold border border-brand-100">
              {user.name.first[0]}{user.name.last[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-[13px] font-bold text-slate-700 leading-none">
                {user.name.first} {user.name.last}
              </p>
              <span className={cn(
                'mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none',
                rolePill[user.role] ?? 'bg-slate-100 text-slate-600'
              )}>
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
