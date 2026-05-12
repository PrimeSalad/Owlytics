import { FileText, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';
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

const STATUS_CLS: Record<string, string> = {
  Done:       'bg-success-50 text-success-600',
  InProgress: 'bg-warning-50 text-warning-600',
  Pending:    'bg-slate-100 text-slate-500',
};

export function CommitteeDashboard() {
  const { user } = useAuthStore();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (isLoading) return <PageSpinner />;

  const myActivities = events.flatMap((e) =>
    e.activities
      .filter((a) => a.committeeId === user?._id)
      .map((a) => ({ ...a, eventTitle: e.title }))
  );

  const done       = myActivities.filter((a) => a.status === 'Done').length;
  const inProgress = myActivities.filter((a) => a.status === 'InProgress').length;
  const updates    = myActivities.reduce((sum, a) => sum + a.updates.length, 0);
  const pct        = myActivities.length ? Math.round((done / myActivities.length) * 100) : 0;

  return (
    <PageWrapper title="Dashboard" description="Your assigned activities and progress.">
      <div className="animate-fade-up space-y-6 pb-12">
        <MessageFeed />

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Assigned"   value={myActivities.length} icon={FileText}     accent="brand"   description="Total activities" />
          <StatCard label="In Progress" value={inProgress}         icon={Clock}        accent="warning" description="Currently working on" />
          <StatCard label="Completed"  value={done}                icon={CheckCircle2} accent="success" description="Activities finished" />
          <StatCard label="Updates Sent" value={updates}           icon={Zap}          accent="brand"   description="Progress updates" />
        </div>

        {/* Main row */}
        <div className="grid gap-5 lg:grid-cols-12">

          {/* My To Do — 8 cols */}
          <div className="lg:col-span-8 flex flex-col">
            <MyTodoCard />
          </div>

          {/* Right column — 4 cols */}
          <div className="lg:col-span-4 flex flex-col gap-5">

            {/* Activity progress */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-display text-[14px] font-semibold text-slate-900">Activity Progress</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">{myActivities.length} total assigned</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Done',        value: done,                                   color: 'bg-emerald-500', track: 'bg-emerald-100' },
                  { label: 'In Progress', value: inProgress,                             color: 'bg-amber-400',   track: 'bg-amber-100'   },
                  { label: 'Pending',     value: myActivities.length - done - inProgress, color: 'bg-slate-300',  track: 'bg-slate-100'   },
                ].map(({ label, value, color, track }) => {
                  const p = myActivities.length ? Math.round((value / myActivities.length) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-600">{label}</span>
                        <span className="font-bold text-slate-800 tabular-nums">{value} <span className="font-normal text-slate-400">({p}%)</span></span>
                      </div>
                      <div className={cn('h-1.5 w-full overflow-hidden rounded-full', track)}>
                        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-1 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Overall</span>
                  <span className="text-[15px] font-bold text-slate-800">{pct}%</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Quick Actions</p>
              <button className="flex w-full items-center gap-3 rounded-xl bg-brand-500 px-4 py-3.5 text-left text-white transition-all hover:bg-brand-600 active:scale-[0.98]">
                <FileText className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold">Post an Update</p>
                  <p className="text-[10px] text-brand-200">Share task progress</p>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3.5 text-left text-danger-600 transition-all hover:bg-danger-100 active:scale-[0.98]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold">Send SOS Alert</p>
                  <p className="text-[10px] text-danger-400">Notify headquarters</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent activities */}
        {myActivities.filter((a) => a.status !== 'Done').length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-display text-[14px] font-semibold text-slate-900">Active Activities</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">Not yet completed</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {myActivities.filter((a) => a.status !== 'Done').slice(0, 5).map((act) => (
                <li key={act._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
                  <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', STATUS_CLS[act.status])}>
                    {act.status === 'InProgress' ? 'In Progress' : act.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{act.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{act.eventTitle}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">{act.updates.length} update{act.updates.length !== 1 ? 's' : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}


