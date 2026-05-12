import { FileText, AlertTriangle, CheckCircle2, Clock, Zap, ArrowUpRight } from 'lucide-react';
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

  return (
    <PageWrapper title="My Tasks">
      <div className="animate-fade-up space-y-7 pb-12">
        <MessageFeed />

        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Your Overview</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Assigned Tasks" value={myActivities.length} icon={FileText}     accent="brand"   description="Total assigned to you" />
            <StatCard label="In Progress"    value={inProgress}          icon={Clock}        accent="warning" description="Currently working on" />
            <StatCard label="Completed"      value={done}                icon={CheckCircle2} accent="success" description="Tasks finished" />
            <StatCard label="Updates Sent"   value={updates}             icon={Zap}          accent="brand"   description="Progress updates" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-12">

          {/* Task queue */}
          <div className="lg:col-span-8">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Task Queue</p>
            {myActivities.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
                <p className="text-[13px] text-slate-300">No tasks assigned to you yet</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myActivities.map((act) => (
                  <div key={act._id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md">
                    <div className="mb-3 flex items-center justify-between">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        act.status === 'Done'       ? 'bg-success-50 text-success-600' :
                        act.status === 'InProgress' ? 'bg-warning-50 text-warning-600' :
                                                      'bg-slate-100 text-slate-500',
                      )}>{act.status === 'InProgress' ? 'In Progress' : act.status}</span>
                      <span className="text-[10px] text-slate-400">{act.updates.length} update{act.updates.length !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="mb-1 text-[13px] font-semibold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">{act.name}</p>
                    <p className="mb-4 truncate text-[11px] text-slate-400">{act.eventTitle}</p>
                    <button className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-600 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600">
                      Post update <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="lg:col-span-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Quick Actions</p>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
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
              <p className="pt-1 text-center text-[10px] text-slate-400">Alerts are sent to the president instantly.</p>
            </div>
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div><MyTodoCard /></div>
        </section>
      </div>
    </PageWrapper>
  );
}
