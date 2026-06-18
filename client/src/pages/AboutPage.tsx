import {
  Users,
  Zap,
  Shield,
  CheckCircle,
  QrCode,
  KanbanSquare,
  CalendarDays,
  FileText,
  Sparkles,
  Layers,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/mascot.png';

const PILLARS: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
  { icon: Users, title: 'Role-Based Access', desc: 'Secure permissions for every role', color: 'from-sky-500 to-blue-600' },
  { icon: Zap, title: 'Real-Time Updates', desc: 'Live collaboration and sync', color: 'from-amber-500 to-orange-600' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Built with modern security', color: 'from-brand-500 to-emerald-600' },
  { icon: Sparkles, title: 'AI-Assisted', desc: 'Smart grammar & writing help', color: 'from-violet-500 to-purple-600' },
];

const STATS = [
  { value: '6', label: 'Core Modules' },
  { value: '5', label: 'Access Roles' },
  { value: 'Real-time', label: 'Sync & Chat' },
  { value: 'AI', label: 'Powered' },
];

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: QrCode, title: 'QR Code Attendance', desc: 'Real-time scanning with instant verification and duplicate prevention.' },
  { icon: Users, title: 'Bulk Student Management', desc: 'CSV import with section-based organization and validation.' },
  { icon: KanbanSquare, title: 'Kanban Task Board', desc: 'Drag-and-drop task management with threaded discussions and mentions.' },
  { icon: CalendarDays, title: 'Event Planning', desc: 'Create and manage events with attendance tracking and analytics.' },
  { icon: FileText, title: 'Comprehensive Reports', desc: 'Generate detailed reports with export and AI writing assistance.' },
  { icon: UserCog, title: 'Role Management', desc: 'Fine-grained access for President, Secretary, Officer, and Attendance.' },
];

const TECH = ['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Express', 'Socket.IO', 'Vite', 'Gemini AI'];

const TEAM = [
  {
    name: 'Gene Elpie Landoy',
    title: 'Lead Fullstack Developer',
    roles: ['UI/UX Designer', 'System Architect', 'Frontend', 'Backend', 'Database'],
    color: 'from-brand-500 to-emerald-600',
  },
  {
    name: 'Mark John Matining',
    title: 'Backend Developer',
    roles: ['API Specialist', 'Integration', 'System Testing'],
    color: 'from-violet-500 to-purple-600',
  },
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2);
}

export function AboutPage() {
  return (
    <PageWrapper title="About Owlytics" description="Student organization management system.">
      <div className="space-y-6">
        {/* ── Hero ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-card-sheen shadow-card-hover">
          {/* Animated glow blobs */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 animate-glow-pulse rounded-full bg-gradient-to-br from-brand-400/40 to-emerald-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 animate-glow-pulse rounded-full bg-gradient-to-br from-violet-400/30 to-sky-500/30 blur-3xl [animation-delay:2s]" />
          {/* Faint grid */}
          <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:32px_32px] opacity-60" />

          <div className="relative flex flex-col items-center gap-6 px-6 py-12 text-center sm:py-16">
            <div className="relative">
              <div className="absolute inset-0 -z-10 animate-glow-pulse rounded-full bg-brand-400/40 blur-2xl" />
              <img
                src={mascotImg}
                alt="Owlytics Mascot"
                className="h-32 w-32 animate-float object-contain drop-shadow-2xl sm:h-40 sm:w-40"
              />
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
                <span className="text-gradient-brand">Owlytics</span>{' '}
                <span className="text-slate-900">Command Center</span>
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-bold text-brand-700 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> v1.0.0
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-700 backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Production Ready
                </span>
              </div>
            </div>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
              A comprehensive student monitoring and organization management system built for{' '}
              <span className="font-bold text-gradient-brand">BSI/T &amp; BSIS</span> student organizations. Streamline
              attendance, events, tasks, real-time chat, and reporting — all in one polished platform.
            </p>

            {/* Stats strip */}
            <div className="mt-2 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/70 bg-white/60 px-3 py-3 backdrop-blur-sm"
                >
                  <p className="font-display text-xl font-black text-gradient-brand">{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pillars ────────────────────────────────────────── */}
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="group relative animate-fade-up overflow-hidden rounded-2xl border border-slate-200/70 bg-card-sheen p-6 text-center shadow-card transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div
                className={cn(
                  'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-btn transition-transform duration-300 ease-spring group-hover:scale-110',
                  p.color,
                )}
              >
                <p.icon className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-sm font-bold text-slate-800">{p.title}</h4>
              <p className="mt-1 text-xs text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Everything you need ────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200/70 bg-card-sheen p-8 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-slate-900">Everything you need</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              <Layers className="h-3.5 w-3.5" /> 6 Core Modules
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group flex gap-3.5 rounded-2xl border border-slate-200/70 bg-white/60 p-4 transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-slate-800">{f.title}</h5>
                  <p className="text-xs leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tech stack ─────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200/70 bg-card-sheen p-8 shadow-card">
          <h3 className="mb-1 font-display text-xl font-bold text-slate-900">Built with modern tech</h3>
          <p className="mb-5 text-sm text-slate-500">A fast, type-safe, real-time stack from front to back.</p>
          <div className="flex flex-wrap gap-2">
            {TECH.map((t) => (
              <span
                key={t}
                className="rounded-xl border border-slate-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Team ───────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200/70 bg-card-sheen p-8 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-slate-900">Meet the team</h3>
            <span className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-btn">
              DotOrbit
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {TEAM.map((dev) => (
              <div
                key={dev.name}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 p-6 text-center transition-all duration-300 ease-out-expo hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div
                  className={cn(
                    'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30',
                    dev.color,
                  )}
                />
                <div className="relative">
                  <div
                    className={cn(
                      'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-black text-white shadow-lg ring-4 ring-white transition-transform duration-300 ease-spring group-hover:scale-105',
                      dev.color,
                    )}
                  >
                    {initials(dev.name)}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{dev.name}</h4>
                  <p className="mt-0.5 text-[11px] font-semibold text-brand-600">{dev.title}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {dev.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-6">
            <CheckCircle className="h-3.5 w-3.5 text-brand-500" />
            <p className="text-xs text-slate-400">© 2026 Owlytics Command Center by DotOrbit. All rights reserved.</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
