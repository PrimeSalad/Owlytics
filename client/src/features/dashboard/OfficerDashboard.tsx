import { CalendarDays, CheckCircle2, Clock, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout';
import { PageSpinner } from '@/components/ui';
import { StatCard } from './StatCard';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';
import { MessageFeed } from './MessageFeed';
import { cn } from '@/lib/utils';

export function OfficerDashboard() {
  const { user } = useAuthStore();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (isLoading) return <PageSpinner />;

  const myEvents = events.filter((e) => e.assignedOfficers.some((o) => o._id === user?._id));
  const allTasks = myEvents.flatMap((e) => e.activities);
  const done     = allTasks.filter((a) => a.status === 'Done').length;
  const active   = myEvents.filter((e) => e.status === 'Ongoing').length;

  return (
    <PageWrapper title="Dashboard">
      <div className="animate-fade-up space-y-7 pb-12">
        <MessageFeed />

        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Your Overview</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Assigned Events" value={myEvents.length}  icon={CalendarDays}  accent="brand"   description="Events you manage" />
            <StatCard label="Active Now"       value={active}           icon={Clock}         accent="warning" description="Currently ongoing" />
            <StatCard label="Tasks Done"       value={done}             icon={CheckCircle2}  accent="success" description="Completed tasks" />
            <StatCard label="Total Tasks"      value={allTasks.length}  icon={Activity}      accent="brand"   description="Across all events" />
          </div>
        </section>

        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Assigned Events</p>
          {myEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
              <p className="text-[13px] text-slate-300">No events assigned to you yet</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myEvents.map((ev) => {
                const total     = ev.activities.length;
                const doneCount = ev.activities.filter((a) => a.status === 'Done').length;
                const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;
                return (
                  <div key={ev._id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">{ev.title}</p>
                      <span className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                        ev.status === 'Ongoing'   ? 'bg-warning-50 text-warning-600' :
                        ev.status === 'Completed' ? 'bg-success-50 text-success-600' :
                                                    'bg-slate-100 text-slate-500',
                      )}>{ev.status}</span>
                    </div>
                    <p className="mb-4 text-[11px] text-slate-400">
                      {new Date(ev.dateRange.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {ev.venue ? ` · ${ev.venue}` : ''}
                    </p>
                    {total > 0 && (
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-slate-400">Task progress</span>
                          <span className="text-[10px] font-semibold text-slate-600">{doneCount}/{total}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  );
}
