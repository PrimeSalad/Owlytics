import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, Circle, Clock, Inbox, ListTodo,
  ChevronDown, ChevronRight, Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MyTask {
  _id: string;
  title: string;
  description?: string;
  status: 'Todo' | 'InProgress' | 'Done';
  sprint_id: string;
  sprint: { _id: string; name: string; status: string } | null;
  createdAt: string;
}

const S = {
  Todo:       { label: 'To Do',       Icon: Circle,       color: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-200',   pill: 'bg-rose-100 text-rose-600',   dot: 'bg-rose-400'   },
  InProgress: { label: 'In Progress', Icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  pill: 'bg-amber-100 text-amber-600',  dot: 'bg-amber-400'  },
  Done:       { label: 'Done',        Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', pill: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-400' },
} as const;

const SPRINT_STATUS: Record<string, { cls: string; dot: string }> = {
  Active:    { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  Planning:  { cls: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-400'   },
  Completed: { cls: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'    },
};

export function TodoPage() {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'All' | MyTask['status']>('All');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => (await api.get<MyTask[]>('/tasks/mine')).data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MyTask['status'] }) =>
      api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const counts = { Todo: 0, InProgress: 0, Done: 0 };
  const grouped = tasks.reduce<Record<string, { sprint: MyTask['sprint']; tasks: MyTask[] }>>((acc, t) => {
    counts[t.status]++;
    if (filter === 'All' || t.status === filter) {
      const key = t.sprint_id ?? 'none';
      if (!acc[key]) acc[key] = { sprint: t.sprint, tasks: [] };
      acc[key].tasks.push(t);
    }
    return acc;
  }, {});
  const pct = tasks.length ? Math.round((counts.Done / tasks.length) * 100) : 0;

  const toggle = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  return (
    <PageWrapper title="My To Do" description="Tasks assigned to you across all sprints.">
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-5 animate-fade-up">

          {/* ── 4 summary cards ── */}
          <div className="grid grid-cols-4 gap-3">
            {/* Overall progress card */}
            <div className="flex flex-col gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100">
                <Target className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall</p>
                <p className="text-2xl font-bold text-slate-800 leading-none mt-0.5">{pct}%</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Status cards */}
            {(['Todo', 'InProgress', 'Done'] as const).map((s) => {
              const { label, Icon, color, bg, border, pill } = S[s];
              const isActive = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(isActive ? 'All' : s)}
                  className={cn(
                    'flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200',
                    isActive
                      ? cn(bg, border, 'shadow-md ring-2 ring-offset-1', color.replace('text-', 'ring-'))
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  )}
                >
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', isActive ? bg : 'bg-slate-100')}>
                    <Icon className={cn('h-4 w-4', isActive ? color : 'text-slate-400')} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-2xl font-bold text-slate-800 leading-none mt-0.5">{counts[s]}</p>
                  </div>
                  {isActive && (
                    <span className={cn('self-start rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', pill)}>
                      Filtered
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Filter bar ── */}
          {filter !== 'All' && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-sm">
              <Target className="h-3.5 w-3.5 text-brand-500" />
              <span className="text-slate-500">Showing</span>
              <span className={cn('font-bold', S[filter].color)}>{S[filter].label}</span>
              <span className="text-slate-400">tasks only</span>
              <button
                onClick={() => setFilter('All')}
                className="ml-auto rounded-lg px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* ── Sprint groups ── */}
          {Object.keys(grouped).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-400">
              No tasks match this filter.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([sprintId, { sprint, tasks: sprintTasks }]) => {
                const isOpen = !collapsed[sprintId];
                const sprintStyle = SPRINT_STATUS[sprint?.status ?? ''] ?? SPRINT_STATUS.Planning;
                const sprintDone = sprintTasks.filter((t) => t.status === 'Done').length;
                const sprintPct = sprintTasks.length ? Math.round((sprintDone / sprintTasks.length) * 100) : 0;

                return (
                  <div key={sprintId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Sprint header */}
                    <button
                      onClick={() => toggle(sprintId)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-slate-300 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                        <ChevronDown className="h-4 w-4" />
                      </span>

                      <ListTodo className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 flex-1 truncate">
                        {sprint?.name ?? 'Unknown Sprint'}
                      </span>

                      {sprint?.status && (
                        <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', sprintStyle.cls)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', sprintStyle.dot)} />
                          {sprint.status}
                        </span>
                      )}

                      {/* mini progress */}
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', sprintPct === 100 ? 'bg-emerald-500' : 'bg-brand-500')}
                            style={{ width: `${sprintPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">{sprintDone}/{sprintTasks.length}</span>
                      </div>

                      <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform duration-200 sm:hidden', isOpen && 'rotate-90')} />
                    </button>

                    {/* Task list */}
                    {isOpen && (
                      <ul className="divide-y divide-slate-100 border-t border-slate-100">
                        {sprintTasks.map((task, i) => (
                          <TaskRow
                            key={task._id}
                            task={task}
                            index={i}
                            isPending={statusMutation.isPending}
                            onStatusChange={(status) => statusMutation.mutate({ id: task._id, status })}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}

/* ── Task row ── */
function TaskRow({
  task, index, isPending, onStatusChange,
}: {
  task: MyTask;
  index: number;
  isPending: boolean;
  onStatusChange: (s: MyTask['status']) => void;
}) {
  const { Icon, color } = S[task.status];
  const isDone = task.status === 'Done';

  return (
    <li
      className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/80 animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Status icon */}
      <div className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', S[task.status].bg)}>
        <Icon className={cn('h-3.5 w-3.5', color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[13px] font-semibold leading-snug text-slate-800 transition-colors',
          isDone && 'line-through text-slate-400'
        )}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{task.description}</p>
        )}
      </div>

      {/* Status buttons — visible on hover or always on mobile */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
        {(['Todo', 'InProgress', 'Done'] as const).map((s) => {
          const { Icon: I, color: ac, bg, border } = S[s];
          const isCurrent = task.status === s;
          return (
            <button
              key={s}
              title={S[s].label}
              disabled={isPending}
              onClick={() => !isCurrent && onStatusChange(s)}
              className={cn(
                'rounded-lg p-1.5 transition-all duration-150 disabled:opacity-40',
                isCurrent
                  ? cn('border', bg, border, ac)
                  : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
              )}
            >
              <I className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </li>
  );
}

/* ── Empty state ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-28 text-center animate-fade-up">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200">
        <Inbox className="h-8 w-8 text-slate-300" />
      </div>
      <p className="font-semibold text-slate-600">No tasks assigned to you</p>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        When someone assigns you a task, it will appear here.
      </p>
    </div>
  );
}
