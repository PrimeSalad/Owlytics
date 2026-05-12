import { GraduationCap, ClipboardList, CalendarDays, CheckCircle2, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout';
import { PageSpinner } from '@/components/ui';
import { StatCard } from './StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';
import type { Event } from '@/types';
import { MessageFeed } from './MessageFeed';
import { cn } from '@/lib/utils';

export function SecretaryDashboard() {
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<{ total: number; students: { yearLevel: number }[] }>('/students?limit=1000')).data,
  });
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (studentsLoading || eventsLoading) return <PageSpinner />;

  const total = studentsData?.total ?? 0;
  const students = studentsData?.students ?? [];
  const completed = events.filter((e) => e.status === 'Completed').length;
  const planning  = events.filter((e) => e.status === 'Planning').length;

  const yearMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  students.forEach((s) => { if (s.yearLevel in yearMap) yearMap[s.yearLevel]++; });
  const yearData = [
    { year: '1st Year', count: yearMap[1], color: '#10b981' },
    { year: '2nd Year', count: yearMap[2], color: '#3b82f6' },
    { year: '3rd Year', count: yearMap[3], color: '#f59e0b' },
    { year: '4th Year', count: yearMap[4], color: '#ef4444' },
  ];

  return (
    <PageWrapper title="Dashboard">
      <div className="animate-fade-up space-y-7 pb-12">
        <MessageFeed />

        {/* KPIs */}
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Overview</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Students"   value={total}          icon={GraduationCap} accent="brand"   description="In registry" />
            <StatCard label="Total Events"     value={events.length}  icon={CalendarDays}  accent="brand"   description="All time" />
            <StatCard label="In Planning"      value={planning}       icon={ClipboardList} accent="warning" description="Upcoming events" />
            <StatCard label="Completed Events" value={completed}      icon={CheckCircle2}  accent="success" description="Finished" />
          </div>
        </section>

        {/* Chart + Recent */}
        <section className="grid gap-6 lg:grid-cols-12">

          {/* Bar chart */}
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="font-display text-[15px] font-semibold text-slate-900">Students by Year Level</h3>
                  <p className="mt-0.5 text-[12px] text-slate-400">How many students are in each year</p>
                </div>
                <GraduationCap className="h-4 w-4 text-slate-300" />
              </div>
              <div className="px-6 py-6">
                {total === 0 ? (
                  <div className="flex h-[240px] items-center justify-center">
                    <p className="text-[13px] text-slate-300">No student data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={yearData} barSize={36} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', padding: '10px 14px', fontSize: '12px' }}
                        formatter={(v: number) => [`${v} students`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                        {yearData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quick exports */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Quick Exports</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Master List', sub: 'Download CSV' },
                  { label: 'Event Summary', sub: 'Export PDF' },
                ].map((item) => (
                  <button key={item.label} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left transition-all hover:border-brand-200 hover:bg-brand-50/30">
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">{item.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{item.sub}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent events */}
          <div className="lg:col-span-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Recent Events</p>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {events.length === 0 ? (
                <div className="py-16 text-center text-[13px] text-slate-300">No events yet</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {events.slice(0, 8).map((e) => (
                    <li key={e._id} className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-800">{e.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {new Date(e.dateRange.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                          e.status === 'Ongoing'   ? 'bg-warning-50 text-warning-600' :
                          e.status === 'Completed' ? 'bg-success-50 text-success-600' :
                                                     'bg-slate-100 text-slate-500',
                        )}>{e.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
