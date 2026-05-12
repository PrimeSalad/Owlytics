import { useState } from 'react';
import { X, CheckCircle2, Circle, Clock, ChevronDown, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import type { Event, User, Activity } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  event: Event;
  onClose: () => void;
}

const statusCycle: Record<Activity['status'], Activity['status']> = {
  Pending: 'InProgress',
  InProgress: 'Done',
  Done: 'Pending',
};

const statusStyle: Record<Activity['status'], string> = {
  Pending:    'text-slate-400',
  InProgress: 'text-warning-500',
  Done:       'text-success-500',
};

const StatusIcon = ({ status }: { status: Activity['status'] }) => {
  if (status === 'Done')       return <CheckCircle2 className="h-5 w-5 text-success-500" />;
  if (status === 'InProgress') return <Clock className="h-5 w-5 text-warning-500" />;
  return <Circle className="h-5 w-5 text-slate-300" />;
};

export function TaskChecklist({ event, onClose }: Props) {
  const queryClient = useQueryClient();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/users')).data,
  });

  const committees = users.filter((u) => u.role === 'Committee' && u.isActive);

  const updateMutation = useMutation({
    mutationFn: async ({ actId, body }: { actId: string; body: Record<string, unknown> }) =>
      api.patch(`/events/${event._id}/activities/${actId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => toast.error('Failed to update task'),
  });

  const cycleStatus = (act: Activity) => {
    updateMutation.mutate({ actId: act._id, body: { status: statusCycle[act.status] } });
  };

  const assignCommittee = (act: Activity, userId: string) => {
    updateMutation.mutate(
      { actId: act._id, body: { committeeId: userId || null } },
      { onSuccess: () => { setAssigningId(null); toast.success('Assigned'); } }
    );
  };

  const done  = event.activities.filter((a) => a.status === 'Done').length;
  const total = event.activities.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-white shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Task Checklist</p>
            <h2 className="mt-1 font-display text-[17px] font-semibold text-slate-900 leading-snug">{event.title}</h2>
            {event.venue && <p className="mt-0.5 text-[12px] text-slate-400">{event.venue}</p>}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Overall progress</span>
            <span className="text-[12px] font-bold text-slate-700">{done}/{total} done</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-success-500' : 'bg-brand-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">{pct}% complete</p>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto">
          {total === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-[13px] text-slate-300">No tasks in this event</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {event.activities.map((act) => {
                const assignee = users.find((u) => u._id === act.committeeId);
                const isAssigning = assigningId === act._id;

                return (
                  <li key={act._id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {/* Status toggle */}
                      <button
                        onClick={() => cycleStatus(act)}
                        disabled={updateMutation.isPending}
                        className="mt-0.5 shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
                        title={`Mark as ${statusCycle[act.status]}`}
                      >
                        <StatusIcon status={act.status} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className={cn('text-[13px] font-semibold leading-snug', act.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-900')}>
                          {act.name}
                        </p>
                        {act.description && (
                          <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{act.description}</p>
                        )}

                        {/* Time */}
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(act.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(act.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        {/* Assignee */}
                        <div className="mt-2">
                          {isAssigning ? (
                            <div className="flex items-center gap-2">
                              <select
                                autoFocus
                                defaultValue={act.committeeId ?? ''}
                                onChange={(e) => assignCommittee(act, e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                              >
                                <option value="">Unassigned</option>
                                {committees.map((u) => (
                                  <option key={u._id} value={u._id}>
                                    {u.name.first} {u.name.last}
                                  </option>
                                ))}
                              </select>
                              <button onClick={() => setAssigningId(null)} className="text-[11px] text-slate-400 hover:text-slate-600">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAssigningId(act._id)}
                              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                            >
                              {assignee ? (
                                <>
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[9px] font-bold text-brand-600 ring-1 ring-brand-100">
                                    {assignee.name.first[0]}{assignee.name.last[0]}
                                  </span>
                                  <span className="text-slate-600 hover:text-brand-600">
                                    {assignee.name.first} {assignee.name.last}
                                  </span>
                                  <ChevronDown className="h-3 w-3 text-slate-400" />
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-slate-400 hover:text-brand-600">Assign member</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Status pill */}
                      <span className={cn('shrink-0 text-[10px] font-bold uppercase tracking-wider', statusStyle[act.status])}>
                        {act.status === 'InProgress' ? 'In Progress' : act.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
