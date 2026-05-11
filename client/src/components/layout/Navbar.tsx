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
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-surface-subtle hover:text-slate-600 transition-colors md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="font-display text-lg font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-surface-subtle hover:text-slate-600 transition-colors focus-ring">
          <Bell className="h-4.5 w-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-surface-border" />

        {/* Avatar + info */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold shadow-sm">
              {user.name.first[0]}{user.name.last[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {user.name.first} {user.name.last}
              </p>
              <span className={cn(
                'mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none',
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
