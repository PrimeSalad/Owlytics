import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, ClipboardList,
  FileText, QrCode, LogOut, ChevronLeft, GraduationCap, ShieldCheck, CheckSquare, ListTodo, Settings, Info, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import logo from '@/assets/logo.png';

interface NavItem { label: string; to: string; icon: React.ElementType; roles: UserRole[]; }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',         to: '/dashboard',  icon: LayoutDashboard, roles: ['President','Secretary','Officer','Committee','Attendance'] },
  { label: 'Events',            to: '/events',     icon: CalendarDays,    roles: ['President','Secretary','Officer','Committee'] },
  { label: 'Tasks',             to: '/tasks',      icon: CheckSquare,     roles: ['President','Secretary','Officer'] },
  { label: 'To Do',             to: '/todo',       icon: ListTodo,        roles: ['President','Secretary','Officer','Committee','Attendance'] },
  { label: 'Attendance',        to: '/attendance', icon: ClipboardList,   roles: ['President','Secretary','Attendance'] },
  { label: 'Scanner',           to: '/scanner',    icon: QrCode,          roles: ['Attendance'] },
  { label: 'Reports',           to: '/reports',    icon: FileText,        roles: ['President','Secretary','Officer','Committee'] },
  { label: 'Student Directory', to: '/students',   icon: GraduationCap,   roles: ['President','Secretary','Officer'] },
  { label: 'People',            to: '/people',     icon: ShieldCheck,     roles: ['President','Secretary'] },
  { label: 'System Logs',       to: '/logs',       icon: Activity,        roles: ['President'] },
];

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const visible = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={cn(
      'relative flex h-screen shrink-0 flex-col border-r border-white/[0.06] bg-[#080f0c] transition-all duration-300',
      // Collapse only applies on desktop; the mobile drawer is always full width.
      collapsed ? 'w-[60px] max-md:w-[220px]' : 'w-[220px]',
    )}>

      {/* Logo */}
      <div className={cn('flex h-[60px] shrink-0 items-center border-b border-white/[0.06] px-4', collapsed && 'justify-center px-0')}>
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 ring-1 ring-brand-500/20">
            <img src={logo} alt="" className="h-4 w-4 object-contain brightness-0 invert" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-[14px] font-semibold leading-none text-white">Owlytics</p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-white/25">Command Center</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {!collapsed && (
          <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/20">Menu</p>
        )}
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => cn(
              'group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
              collapsed && 'justify-center px-0',
              isActive
                ? 'bg-brand-500/[0.12] text-brand-400'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80',
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400" />
                )}
                <item.icon className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-brand-400' : 'text-white/30',
                )} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings + About + Logout */}
      <div className="shrink-0 border-t border-white/[0.06] p-2 space-y-0.5">
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) => cn(
            'group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all duration-200',
            collapsed && 'justify-center px-0',
            isActive
              ? 'bg-brand-500/[0.12] text-brand-400'
              : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80',
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <NavLink
          to="/about"
          title={collapsed ? 'About' : undefined}
          className={({ isActive }) => cn(
            'group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all duration-200',
            collapsed && 'justify-center px-0',
            isActive
              ? 'bg-brand-500/[0.12] text-brand-400'
              : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80',
          )}
        >
          <Info className="h-4 w-4 shrink-0" />
          {!collapsed && <span>About</span>}
        </NavLink>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium',
            'text-white/25 transition-all duration-200 hover:bg-danger-500/10 hover:text-danger-400',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle — desktop only (mobile uses the drawer + overlay) */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand' : 'Collapse'}
        className="absolute -right-3 top-[72px] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0d1a14] text-white/30 shadow-md transition-all duration-200 hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-brand-400 md:flex"
      >
        <ChevronLeft className={cn('h-3 w-3 transition-transform duration-300', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
