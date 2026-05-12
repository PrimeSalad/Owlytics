import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, ListTodo } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MyTask {
  _id: string;
  title: string;
  status: 'Todo' | 'InProgress' | 'Done';
  sprint_id: string;
  sprint: { name: string } | null;
}

const S = {
  Todo:       { Icon: Circle,       color: 'text-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-200'    },
  InProgress: { Icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  Done:       { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
} as const;

export function MyTodoCard() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => (await api.get<MyTask[]>('/tasks/mine')).data,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MyTask['status'] }) =>
      api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const done  = tasks.filter((t) => t.status === 'Done').length;
  const pct   = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-brand-500" />
          <h3 className="font-display text-[14px] font-semibold text-slate-900">My To Do</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{done}/{tasks.length}</span>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : 'bg-brand-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="py-10 text-center text-[12px] text-slate-300">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-slate-300">No tasks assigned to you</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const { Icon, color, bg } = S[task.status];
              return (
                <li key={task._id} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 transition-colors">
                  <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full', bg)}>
                    <Icon className={cn('h-3.5 w-3.5', color)} />
                  </div>
                  <p className={cn(
                    'flex-1 min-w-0 truncate text-[12px] font-medium text-slate-700',
                    task.status === 'Done' && 'line-through text-slate-400'
                  )}>
                    {task.title}
                  </p>
                  {/* Quick toggle buttons */}
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(['Todo', 'InProgress', 'Done'] as const).map((s) => {
                      const { Icon: I, color: ac, bg: b, border } = S[s];
                      const isCurrent = task.status === s;
                      return (
                        <button
                          key={s}
                          title={s}
                          disabled={mutation.isPending}
                          onClick={() => !isCurrent && mutation.mutate({ id: task._id, status: s })}
                          className={cn(
                            'rounded-lg p-1 transition-all disabled:opacity-40',
                            isCurrent ? cn('border', b, border, ac) : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                          )}
                        >
                          <I className="h-3 w-3" />
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
