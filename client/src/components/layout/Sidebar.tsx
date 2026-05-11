import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays,
  ClipboardList, FileText, QrCode, LogOut, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import logo from '@/assets/logo.png';

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
        'relative flex h-screen flex-col bg-[#0a1612] text-white transition-all duration-200 shrink-0 border-r border-white/5',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-14 items-center px-4 border-b border-white/5', collapsed && 'justify-center')}>
        {collapsed ? (
          <div className="h-7 w-7 flex items-center justify-center">
            <img src={logo} alt="Owlytics" className="h-5 w-5 object-contain brightness-0 invert" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 flex items-center justify-center">
              <img src={logo} alt="Owlytics" className="h-5 w-5 object-contain brightness-0 invert" />
            </div>
            <span className="font-display text-[15px] font-semibold tracking-tight">Owlytics</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] font-medium transition-colors mb-0.5',
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white',
                collapsed && 'justify-center'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-2">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2.5 py-2 mb-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-xs font-medium">
              {user.name.first[0]}{user.name.last[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user.name.first} {user.name.last}</p>
              <p className="text-[10px] text-white/30">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-[13px] text-white/40 hover:bg-white/5 hover:text-white transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-2.5 top-16 flex h-5 w-5 items-center justify-center rounded-full bg-[#0a1612] border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
        aria-label={collapsed ? 'Expand' : 'Collapse'}
      >
        <ChevronLeft className={cn('h-3 w-3 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
