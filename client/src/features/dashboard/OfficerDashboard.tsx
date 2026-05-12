import { CalendarDays, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout';
import { PageSpinner } from '@/components/ui';
import { StatCard } from './StatCard';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';
import { MessageFeed } from './MessageFeed';
import { MyTodoCard } from './MyTodoCard';
import { cn } from '@/lib/utils';

export function OfficerDashboard() {
  const { user } = useAuthStore();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (isLoading) return <PageSpinner />;

  const myEvents  = events.filter((e) => e.assignedOfficers.some((o) => o._id === user?._id));
  const allTasks  = myEvents.flatMap((e) => e.activities);
  const done      = allTasks.filter((a) => a.status === 'Done').length;
  const inProg    = allTasks.filter((a) => a.status === 'InProgress').length;
  const active    = myEvents.filter((e) => e.status === 'Ongoing').length;
  const upcoming  = myEvents.filter((e) => e.status === 'Planning').length;

  return (
    <PageWrapper title="Dashboard" description="Your assigned events, tasks, and progress at a glance.">
      <div className="animate-fade-up space-y-6 pb-12">
        <MessageFeed />

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Assigned Events" value={myEvents.length} icon={CalendarDays}  accent="brand"   description="Events you manage" />
          <StatCard label="Active Now"       value={active}          icon={Clock}         accent="warning" description="Currently ongoing" />
          <StatCard label="Upcoming"         value={upcoming}        icon={AlertCircle}   accent="brand"   description="In planning" />
          <StatCard label="Tasks Done"       value={done}            icon={CheckCircle2}  accent="success" description={`${allTasks.length} total`} />
        </div>

        {/* ── My To Do + Task breakdown ── */}
        <div className="grid gap-5 lg:grid-cols-12">

          {/* My To Do — 8 cols */}
          <div className="lg:col-span-8 flex flex-col">
            <MyTodoCard />
          </div>

          {/* Task breakdown — 4 cols */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-display text-[14px] font-semibold text-slate-900">Task Breakdown</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">Across all assigned events</p>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Done',        value: done,                          color: 'bg-emerald-500', track: 'bg-emerald-100' },
                  { label: 'In Progress', value: inProg,                        color: 'bg-amber-400',   track: 'bg-amber-100'   },
                  { label: 'Pending',     value: allTasks.length - done - inProg, color: 'bg-slate-300', track: 'bg-slate-100'   },
                ].map(({ label, value, color, track }) => {
                  const pct = allTasks.length ? Math.round((value / allTasks.length) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="mb-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-600">{label}</span>
                        <span className="font-bold text-slate-800 tabular-nums">{value} <span className="font-normal text-slate-400">({pct}%)</span></span>
                      </div>
                      <div className={cn('h-2 w-full overflow-hidden rounded-full', track)}>
                        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}

                <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Overall completion</span>
                  <span className="text-[15px] font-bold text-slate-800 tabular-nums">
                    {allTasks.length ? Math.round((done / allTasks.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}


