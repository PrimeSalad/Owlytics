import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, Plus, Send, MessageSquare, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Badge, Button, Card, CardBody, Input, Modal, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const COLUMNS = [
  { id: 'Todo' as const, label: 'To Do', icon: Circle, color: 'slate' },
  { id: 'InProgress' as const, label: 'In Progress', icon: Clock, color: 'blue' },
  { id: 'Done' as const, label: 'Done', icon: CheckCircle2, color: 'green' },
];

export function TasksPage() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get<Task[]>('/tasks')).data,
  });

  return (
    <PageWrapper title="Task Management" description="Collaborate across roles with real-time updates.">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {COLUMNS.map((col) => {
              const count = tasks.filter((t) => t.status === col.id).length;
              const Icon = col.icon;
              return (
                <div key={col.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                  <Icon className={cn('h-4 w-4', `text-${col.color}-600`)} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
          <Button onClick={() => setCreateOpen(true)} className="shadow-lg shadow-brand-500/20">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const Icon = col.icon;
              const columnTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className="flex flex-col gap-3">
                  <div className={cn('flex items-center gap-2 rounded-t-xl border-b-2 bg-gradient-to-br px-4 py-3', 
                    col.color === 'slate' && 'border-slate-300 from-slate-50 to-slate-100',
                    col.color === 'blue' && 'border-blue-400 from-blue-50 to-blue-100',
                    col.color === 'green' && 'border-green-400 from-green-50 to-green-100',
                  )}>
                    <Icon className={cn('h-4 w-4', `text-${col.color}-600`)} />
                    <h3 className={cn('text-sm font-bold uppercase tracking-wider', `text-${col.color}-700`)}>{col.label}</h3>
                    <span className={cn('ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold', 
                      col.color === 'slate' && 'bg-slate-200 text-slate-700',
                      col.color === 'blue' && 'bg-blue-200 text-blue-700',
                      col.color === 'green' && 'bg-green-200 text-green-700',
                    )}>{columnTasks.length}</span>
                  </div>

                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                        <p className="text-xs text-slate-400">No tasks</p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <Card key={task._id} className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5" onClick={() => setSelectedTask(task)}>
                          <CardBody className="p-4 space-y-3">
                            <h4 className="font-semibold text-slate-900 leading-snug group-hover:text-brand-600 transition">{task.title}</h4>
                            {task.description && <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>}
                            
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>{task.comments.length}</span>
                              </div>
                              {task.assignees.length > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>{task.assignees.length}</span>
                                </div>
                              )}
                              {task.viewingNow.length > 0 && (
                                <div className="ml-auto flex items-center gap-1.5">
                                  <div className="flex -space-x-1">
                                    {task.viewingNow.slice(0, 3).map((_, i) => (
                                      <div key={i} className="h-5 w-5 rounded-full border-2 border-white bg-brand-100 ring-1 ring-brand-200" />
                                    ))}
                                  </div>
                                  <span className="text-xs font-medium text-brand-600">{task.viewingNow.length} viewing</span>
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {createOpen && (
        <CreateTaskModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setCreateOpen(false);
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
        />
      )}
    </PageWrapper>
  );
}

function CreateTaskModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => api.post('/tasks', data),
    onSuccess: () => {
      toast.success('Task created');
      onSuccess();
    },
    onError: () => toast.error('Failed to create task'),
  });

  return (
    <Modal open onClose={onClose} title="New Task" size="lg">
      <div className="space-y-4 pt-2">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description (optional)"
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate({ title, description })} loading={mutation.isPending} disabled={!title.trim()}>
            Create Task
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TaskDetailModal({ task, onClose, onUpdate }: { task: Task; onClose: () => void; onUpdate: () => void }) {
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');

  const statusMutation = useMutation({
    mutationFn: (status: Task['status']) => api.patch(`/tasks/${task._id}`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      onUpdate();
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/tasks/${task._id}/comments`, { content, mentions: [] }),
    onSuccess: () => {
      setComment('');
      onUpdate();
    },
  });

  return (
    <Modal open onClose={onClose} title="" size="2xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">{task.title}</h2>
          {task.description && (
            <p className="text-sm leading-relaxed text-slate-600">{task.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>by {task.createdBy.name.first} {task.createdBy.name.last}</span>
          </div>
        </div>

        {/* Status selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</label>
          <div className="flex gap-2">
            {COLUMNS.map((col) => {
              const Icon = col.icon;
              const isActive = task.status === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => statusMutation.mutate(col.id)}
                  disabled={statusMutation.isPending}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all',
                    isActive
                      ? col.color === 'slate' && 'border-slate-400 bg-slate-50 text-slate-700 shadow-sm'
                      : '',
                    isActive
                      ? col.color === 'blue' && 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                      : '',
                    isActive
                      ? col.color === 'green' && 'border-green-400 bg-green-50 text-green-700 shadow-sm'
                      : '',
                    !isActive && 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {col.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Discussion</h4>
            <Badge variant="default" className="bg-slate-100 text-slate-600">{task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</Badge>
          </div>

          <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg bg-slate-50 p-4">
            {task.comments.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">No comments yet. Start the discussion!</p>
              </div>
            ) : (
              task.comments.map((c) => (
                <div key={c._id} className="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white shadow-md">
                    {c.userId.name.first[0]}{c.userId.name.last[0]}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{c.userId.name.first} {c.userId.name.last}</span>
                      <Badge variant="default" className="bg-brand-50 text-brand-700 text-[10px] font-bold">{c.userId.role}</Badge>
                      <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add comment */}
          <div className="flex gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
              {user?.name.first[0]}{user?.name.last[0]}
            </div>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && comment.trim()) {
                  commentMutation.mutate(comment);
                }
              }}
            />
            <Button size="sm" onClick={() => comment.trim() && commentMutation.mutate(comment)} loading={commentMutation.isPending} disabled={!comment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
