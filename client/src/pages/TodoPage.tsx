import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, Inbox, ListTodo } from 'lucide-react';
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
  Todo:       { label: 'To Do',       Icon: Circle,       ring: 'text-slate-300',  active: 'text-red-500',   activeBg: 'bg-red-50 border-red-200' },
  InProgress: { label: 'In Progress', Icon: Clock,        ring: 'text-slate-300',  active: 'text-blue-500',  activeBg: 'bg-blue-50 border-blue-200' },
  Done:       { label: 'Done',        Icon: CheckCircle2, ring: 'text-slate-300',  active: 'text-green-500', activeBg: 'bg-green-50 border-green-200' },
} as const;

const SPRINT_STATUS_STYLE: Record<string, string> = {
  Active:    'bg-green-100 text-green-700',
  Planning:  'bg-slate-100 text-slate-500',
  Completed: 'bg-blue-100 text-blue-700',
};

export function TodoPage() {
  const queryClient = useQueryClient();

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

  const grouped = tasks.reduce<Record<string, { sprint: MyTask['sprint']; tasks: MyTask[] }>>((acc, t) => {
    const key = t.sprint_id ?? 'none';
    if (!acc[key]) acc[key] = { sprint: t.sprint, tasks: [] };
    acc[key].tasks.push(t);
    return acc;
  }, {});

  const counts = {
    Todo:       tasks.filter((t) => t.status === 'Todo').length,
    InProgress: tasks.filter((t) => t.status === 'InProgress').length,
    Done:       tasks.filter((t) => t.status === 'Done').length,
  };

  return (
    <PageWrapper title="My To Do" description="Tasks assigned to you across all sprints.">
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Inbox className="h-7 w-7 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-500">No tasks assigned to you</p>
          <p className="mt-1 text-sm text-slate-400">When someone assigns you a task, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {(['Todo', 'InProgress', 'Done'] as const).map((s) => {
              const { label, Icon, active, activeBg } = S[s];
              return (
                <div key={s} className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3.5', activeBg)}>
                  <Icon className={cn('h-5 w-5 shrink-0', active)} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-800 leading-none mt-0.5">{counts[s]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          {tasks.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Overall progress</span>
                <span className="font-bold text-slate-700">{counts.Done}/{tasks.length} done</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', counts.Done === tasks.length ? 'bg-green-500' : 'bg-brand-500')}
                  style={{ width: `${Math.round((counts.Done / tasks.length) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Tasks grouped by sprint */}
          {Object.entries(grouped).map(([sprintId, { sprint, tasks: sprintTasks }]) => (
            <div key={sprintId}>
              {/* Sprint header */}
              <div className="mb-2 flex items-center gap-2 px-1">
                <ListTodo className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {sprint?.name ?? 'Unknown Sprint'}
                </span>
                {sprint?.status && (
                  <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', SPRINT_STATUS_STYLE[sprint.status] ?? 'bg-slate-100 text-slate-500')}>
                    {sprint.status}
                  </span>
                )}
                <span className="ml-auto text-[10px] text-slate-400">{sprintTasks.length} task{sprintTasks.length !== 1 ? 's' : ''}</span>
              </div>

              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {sprintTasks.map((task) => {
                  const { Icon, active } = S[task.status];
                  return (
                    <li key={task._id} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50">
                      {/* Current status icon */}
                      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', active)} />

                      {/* Title + description */}
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[13px] font-semibold leading-snug text-slate-800',
                          task.status === 'Done' && 'line-through text-slate-400'
                        )}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{task.description}</p>
                        )}
                      </div>

                      {/* Status toggle buttons */}
                      <div className="flex shrink-0 items-center gap-0.5">
                        {(['Todo', 'InProgress', 'Done'] as const).map((s) => {
                          const { Icon: I, active: ac, activeBg } = S[s];
                          const isCurrent = task.status === s;
                          return (
                            <button
                              key={s}
                              title={S[s].label}
                              disabled={statusMutation.isPending}
                              onClick={() => !isCurrent && statusMutation.mutate({ id: task._id, status: s })}
                              className={cn(
                                'rounded-lg p-1.5 transition-colors disabled:opacity-50',
                                isCurrent
                                  ? cn('border', activeBg, ac)
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
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
