import { QrCode, Users, CheckCircle2, Clock, MapPin, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '@/components/layout';
import { PageSpinner, Button } from '@/components/ui';
import { StatCard } from './StatCard';
import { MessageFeed } from './MessageFeed';
import { MyTodoCard } from './MyTodoCard';
import { api } from '@/lib/api';
import type { Event } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_CLS: Record<string, string> = {
  Ongoing:   'bg-warning-50 text-warning-600',
  Completed: 'bg-success-50 text-success-600',
  Planning:  'bg-slate-100 text-slate-500',
  Cancelled: 'bg-danger-50 text-danger-500',
};

export function AttendanceDashboard() {
  const navigate = useNavigate();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (isLoading) return <PageSpinner />;

  const active    = events.filter((e) => e.status === 'Ongoing');
  const completed = events.filter((e) => e.status === 'Completed').length;
  const planning  = events.filter((e) => e.status === 'Planning').length;
  const activeEvent = active[0] ?? null;

  return (
    <PageWrapper title="Dashboard" description="Active session monitoring and QR scanning.">
      <div className="animate-fade-up space-y-6 pb-12">
        <MessageFeed />

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active Events" value={active.length}  icon={Clock}        accent="warning" description="Currently ongoing" />
          <StatCard label="Total Events"  value={events.length}  icon={CalendarDays} accent="brand"   description="All time" />
          <StatCard label="Completed"     value={completed}      icon={CheckCircle2} accent="success" description="Finished" />
          <StatCard label="Planning"      value={planning}       icon={Users}        accent="brand"   description="Upcoming" />
        </div>

        {/* Main row */}
        <div className="grid gap-5 lg:grid-cols-12">

          {/* Active session + Scanner — 4 cols */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-display text-[14px] font-semibold text-slate-900">Active Session</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">{activeEvent ? 'Event in progress' : 'No active event'}</p>
              </div>
              <div className="p-5 space-y-4">
                {activeEvent ? (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2.5">
                    <p className="text-[13px] font-semibold text-slate-900 leading-snug">{activeEvent.title}</p>
                    {activeEvent.venue && (
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" />{activeEvent.venue}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(activeEvent.dateRange.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning-600">Ongoing</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 py-8 text-center">
                    <p className="text-[12px] text-slate-400">No active event right now</p>
                  </div>
                )}
                <Button className="w-full" onClick={() => navigate('/scanner')}>
                  <QrCode className="mr-2 h-4 w-4" /> Open Scanner
                </Button>
              </div>
            </div>
          </div>

          {/* Events list — 5 cols */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-display text-[14px] font-semibold text-slate-900">All Events</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">{events.length} total</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="py-16 text-center text-[13px] text-slate-300">No events yet</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {events.map((e) => (
                      <li key={e._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-800">{e.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {new Date(e.dateRange.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {e.venue ? ` · ${e.venue}` : ''}
                          </p>
                        </div>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', STATUS_CLS[e.status] ?? 'bg-slate-100 text-slate-500')}>
                          {e.status}
                        </span>
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
    </PageWrapper>
  );
}
