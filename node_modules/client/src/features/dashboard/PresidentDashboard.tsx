import { useState } from 'react';
import {
  CalendarCheck2, ShieldAlert, UsersRound, Radio,
  CheckCircle2, Clock, ChevronRight, BarChart2, Trophy,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { PageWrapper } from '@/components/layout';
import { PageSpinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Event, Report } from '@/types';
import { MessageFeed } from './MessageFeed';
import { TaskChecklist } from './TaskChecklist';
import { StatCard } from './StatCard';
import { MyTodoCard } from './MyTodoCard';
import { cn } from '@/lib/utils';

/* ── helpers ── */
function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short' });
}

function buildMonthlyChart(events: Event[]) {
  const map: Record<string, { completed: number; total: number }> = {};
  events.forEach((e) => {
    const m = monthLabel(e.dateRange.start);
    if (!map[m]) map[m] = { completed: 0, total: 0 };
    map[m].total++;
    if (e.status === 'Completed') map[m].completed++;
  });
  return Object.entries(map).slice(-6).map(([month, v]) => ({ month, ...v }));
}

function buildStatusChart(events: Event[]) {
  const counts: Record<string, number> = { Planning: 0, Ongoing: 0, Completed: 0, Cancelled: 0 };
  events.forEach((e) => counts[e.status]++);
  return [
    { label: 'Planning',  value: counts.Planning,  color: '#94a3b8' },
    { label: 'Ongoing',   value: counts.Ongoing,   color: '#f59e0b' },
    { label: 'Completed', value: counts.Completed, color: '#10b981' },
    { label: 'Cancelled', value: counts.Cancelled, color: '#ef4444' },
  ].filter((d) => d.value > 0);
}

export function PresidentDashboard() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });
  const { data: emergencies = [], isLoading: emergLoading } = useQuery({
    queryKey: ['reports', 'Emergency'],
    queryFn: async () => (await api.get<Report[]>('/reports?type=Emergency')).data,
  });
  const { data: accomplishments = [] } = useQuery({
    queryKey: ['reports', 'Accomplishment'],
    queryFn: async () => (await api.get<Report[]>('/reports?type=Accomplishment')).data,
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<{ _id: string }[]>('/users')).data,
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/reports/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report resolved');
    },
  });

  if (eventsLoading || emergLoading) return <PageSpinner />;

  const active     = events.filter((e) => e.status === 'Ongoing');
  const completed  = events.filter((e) => e.status === 'Completed');
  const unresolved = emergencies.filter((r) => !r.isResolved);
  const monthlyData = buildMonthlyChart(events);
  const statusData  = buildStatusChart(events);

  return (
    <PageWrapper title="Dashboard" description="Real-time snapshot of events, tasks, and alerts across the organization.">
      <div className="animate-fade-up space-y-6 pb-12">

        {/* ── Announcement ── */}
        <MessageFeed />

        {/* ── KPI row — 4 cards ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active Events"    value={active.length}    icon={Radio}          accent="warning" description="Currently running" />
          <StatCard label="Total Events"     value={events.length}    icon={CalendarCheck2} accent="brand"   description={`${completed.length} completed`} />
          <StatCard label="Org Members"      value={users.length}     icon={UsersRound}     accent="success" description="Registered accounts" />
          <StatCard label="Open Alerts"      value={unresolved.length} icon={ShieldAlert}   accent={unresolved.length > 0 ? 'danger' : 'success'} description={unresolved.length > 0 ? 'Needs attention' : 'All clear'} />
        </div>

        {/* ── Charts row ── */}
        <div className="grid gap-5 lg:grid-cols-12">

          {/* Monthly events area chart — 8 cols */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="font-display text-[15px] font-semibold text-slate-900">Events per Month</h3>
                  <p className="mt-0.5 text-[12px] text-slate-400">Total vs completed events over the last 6 months</p>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                  <BarChart2 className="h-3.5 w-3.5" />
                  {monthlyData.length} months
                </span>
              </div>
              <div className="px-4 py-5">
                {monthlyData.length === 0 ? (
                  <div className="flex h-[220px] items-center justify-center">
                    <p className="text-[13px] text-slate-300">No event data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#94a3b8" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', padding: '10px 14px', fontSize: '12px' }}
                        cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                      />
                      <Area type="monotone" dataKey="total"     name="Total"     stroke="#94a3b8" strokeWidth={2} fill="url(#gTotal)" dot={false} />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2.5} fill="url(#gDone)"
                        dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Event status pie chart — 4 cols */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-display text-[15px] font-semibold text-slate-900">Events by Status</h3>
                <p className="mt-0.5 text-[12px] text-slate-400">Breakdown of all {events.length} events</p>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-5 py-4">
                {statusData.length === 0 ? (
                  <p className="text-[13px] text-slate-300">No data</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={72}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', padding: '8px 12px', fontSize: '12px' }}
                          formatter={(v: number, name: string) => [`${v} events`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-1 flex w-full flex-col gap-2">
                      {statusData.map((d) => (
                        <div key={d.label} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-[12px] text-slate-600">
                            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                            {d.label}
                          </span>
                          <span className="text-[12px] font-semibold text-slate-800 tabular-nums">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row: Events list + Alerts + Accomplishments + My Todo ── */}
        <div className="grid gap-5 lg:grid-cols-12">

          {/* Events list — 4 cols */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-display text-[14px] font-semibold text-slate-900">Events</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">Click to manage tasks</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{events.length}</span>
              </div>
              {events.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-slate-300">No events yet</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {events.slice(0, 6).map((e) => {
                    const t = e.activities.length;
                    const d = e.activities.filter((a) => a.status === 'Done').length;
                    return (
                      <li key={e._id}>
                        <button
                          onClick={() => setSelectedEvent(e)}
                          className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className={cn('h-2 w-2 shrink-0 rounded-full',
                            e.status === 'Ongoing'   ? 'bg-warning-400' :
                            e.status === 'Completed' ? 'bg-success-400' :
                            e.status === 'Cancelled' ? 'bg-danger-400'  : 'bg-slate-300',
                          )} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">{e.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {new Date(e.dateRange.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              {t > 0 ? ` · ${d}/${t} tasks` : ''}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-400 transition-colors" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Emergency alerts — 3 cols */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-display text-[14px] font-semibold text-slate-900">Emergency Reports</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">Unresolved alerts</p>
                </div>
                {unresolved.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-danger-500" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-danger-500">Live</span>
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {unresolved.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-50">
                      <CheckCircle2 className="h-5 w-5 text-success-500" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700">All clear</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {unresolved.map((r) => (
                      <li key={r._id} className="px-5 py-4 hover:bg-slate-50/70 transition-colors">
                        <div className="mb-1 flex justify-between gap-2">
                          <p className="text-[13px] font-semibold text-slate-900 line-clamp-1">{r.title}</p>
                          <button
                            onClick={() => resolveMutation.mutate(r._id)}
                            disabled={resolveMutation.isPending}
                            className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-40"
                          >
                            Resolve
                          </button>
                        </div>
                        <p className="mb-2 text-[12px] leading-relaxed text-slate-500 line-clamp-2">{r.content}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-slate-300">·</span>
                          {r.authorId.name.first} {r.authorId.name.last}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Accomplishments — 2 cols */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-display text-[14px] font-semibold text-slate-900">Accomplishments</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">Recent wins</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {accomplishments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12">
                    <Trophy className="h-6 w-6 text-slate-200" />
                    <p className="text-[12px] text-slate-300">No reports yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {accomplishments.slice(0, 5).map((r) => (
                      <li key={r._id} className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                        <p className="text-[12px] font-semibold text-slate-800 line-clamp-1">{r.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{r.content}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          {/* My To Do — 3 cols */}
          <div className="lg:col-span-3 flex flex-col">
            <MyTodoCard />
          </div>
        </div>
      </div>

      {selectedEvent && (
        <TaskChecklist event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </PageWrapper>
  );
}


