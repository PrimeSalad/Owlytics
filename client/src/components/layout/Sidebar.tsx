import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays,
  ClipboardList, FileText, QrCode, LogOut, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  to: '/dashboard',  icon: LayoutDashboard, roles: ['President','Secretary','Officer','Committee','Attendance'] },
  { label: 'Students',   to: '/students',   icon: GraduationCap,   roles: ['President','Secretary','Officer'] },
  { label: 'Events',     to: '/events',     icon: CalendarDays,    roles: ['President','Secretary','Officer','Committee'] },
  { label: 'Attendance', to: '/attendance', icon: ClipboardList,   roles: ['President','Secretary','Attendance'] },
  { label: 'Scanner',    to: '/scanner',    icon: QrCode,          roles: ['Attendance'] },
  { label: 'Reports',    to: '/reports',    icon: FileText,        roles: ['President','Secretary','Officer','Committee'] },
  { label: 'Members',    to: '/members',    icon: Users,           roles: ['President','Secretary'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const visible = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        'flex h-screen flex-col text-white transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
      style={{ background: 'linear-gradient(180deg, #0d1f1a 0%, #064e3b 100%)' }}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-white/10 px-4', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 font-display text-sm font-bold">
          S
        </div>
        {!collapsed && (
          <span className="font-display text-sm font-semibold leading-tight">
            Student<br />Monitor
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {!collapsed && user && (
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-white truncate">{user.name.first} {user.name.last}</p>
            <p className="text-xs text-white/40">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-md hover:bg-brand-600 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform duration-300', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
