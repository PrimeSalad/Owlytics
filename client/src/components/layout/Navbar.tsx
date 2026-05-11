import { Bell, Menu, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
}

const roleColors: Record<string, string> = {
  President:  'primary',
  Secretary:  'info',
  Officer:    'warning',
  Committee:  'default',
  Attendance: 'success',
};

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-surface-subtle transition-colors md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="font-display text-lg font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search trigger (placeholder) */}
        <button className="hidden md:flex items-center gap-2 rounded-lg border border-surface-border bg-surface-muted px-3 py-1.5 text-sm text-slate-400 hover:border-brand-300 transition-colors w-52">
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-auto text-xs bg-surface-border rounded px-1">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-surface-subtle transition-colors focus-ring">
          <Bell className="h-5 w-5" />
          {/* Unread dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        {/* Avatar */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              {user.name.first[0]}{user.name.last[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-medium text-slate-800 leading-none">
                {user.name.first} {user.name.last}
              </p>
              <Badge
                variant={roleColors[user.role] as Parameters<typeof Badge>[0]['variant']}
                className={cn('mt-0.5 text-[10px] px-1.5 py-0')}
              >
                {user.role}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
