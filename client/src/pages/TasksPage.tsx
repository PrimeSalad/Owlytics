import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { CheckCircle2, Circle, Clock, Plus, Send, MessageSquare, Users, Calendar, Eye, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Badge, Button, Card, CardBody, Input, Modal, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Task, UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const COLUMNS = [
  { id: 'Todo' as const, label: 'To Do', icon: Circle, color: 'red' },
  { id: 'InProgress' as const, label: 'In Progress', icon: Clock, color: 'blue' },
  { id: 'Done' as const, label: 'Done', icon: CheckCircle2, color: 'green' },
];

const ALL_ROLES: UserRole[] = ['President', 'Secretary', 'Officer', 'Committee', 'Attendance'];

const ROLE_COLORS: Record<UserRole, string> = {
  President: 'bg-brand-100 text-brand-700 border-brand-200',
  Secretary: 'bg-blue-100 text-blue-700 border-blue-200',
  Officer: 'bg-amber-100 text-amber-700 border-amber-200',
  Committee: 'bg-slate-100 text-slate-600 border-slate-200',
  Attendance: 'bg-green-100 text-green-700 border-green-200',
};

// ── Draggable Task Card ───────────────────────────────────────
function DraggableCard({
  task, canCreate, onClick,
}: { task: Task; canCreate: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn('rounded-xl outline-none', isDragging && 'opacity-40')}
    >
      <Card
        className="group cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:-translate-y-0.5"
        onClick={isDragging ? undefined : onClick}
      >
        <CardBody className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-slate-900 leading-snug group-hover:text-brand-600 transition">{task.title}</h4>
              {task.description && <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>}

              {canCreate && task.visible_to?.length > 0 && task.visible_to.length < ALL_ROLES.length && (
                <div className="flex flex-wrap gap-1">
                  {task.visible_to.map((role) => (
                    <span key={role} className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', ROLE_COLORS[role])}>
                      <Eye className="h-2.5 w-2.5" />{role}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MessageSquare className="h-3.5 w-3.5" /><span>{task.comments.length}</span>
                </div>
                {task.assignees.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="h-3.5 w-3.5" /><span>{task.assignees.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ── Droppable Column ──────────────────────────────────────────
function DroppableColumn({
  col, tasks, canCreate, onTaskClick,
}: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  canCreate: boolean;
  onTaskClick: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const Icon = col.icon;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn('flex items-center gap-2 rounded-t-xl border-b-2 bg-gradient-to-br px-4 py-3',
        col.color === 'red' && 'border-red-300 from-red-50 to-red-100',
        col.color === 'blue' && 'border-blue-400 from-blue-50 to-blue-100',
        col.color === 'green' && 'border-green-400 from-green-50 to-green-100',
      )}>
        <Icon className={cn('h-4 w-4', `text-${col.color}-600`)} />
        <h3 className={cn('text-sm font-bold uppercase tracking-wider', `text-${col.color}-700`)}>{col.label}</h3>
        <span className={cn('ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
          col.color === 'red' && 'bg-red-200 text-red-700',
          col.color === 'blue' && 'bg-blue-200 text-blue-700',
          col.color === 'green' && 'bg-green-200 text-green-700',
        )}>{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[120px] space-y-3 rounded-xl p-2 transition-colors',
          isOver && 'bg-brand-50 ring-2 ring-brand-300 ring-dashed',
        )}
      >
        {tasks.length === 0 ? (
          <div className={cn('rounded-xl border-2 border-dashed py-8 text-center transition-colors',
            isOver ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50',
          )}>
            <p className="text-xs text-slate-400">{isOver ? 'Drop here' : 'No tasks'}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableCard key={task._id} task={task} canCreate={canCreate} onClick={() => onTaskClick(task)} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export function TasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const canCreate = user?.role === 'President' || user?.role === 'Secretary';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get<Task[]>('/tasks')).data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Failed to move task'),
  });

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find((t) => t._id === e.active.id);
    if (task) setDraggingTask(task);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingTask(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as Task['status'];
    const task = tasks.find((t) => t._id === active.id);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
      old.map((t) => t._id === task._id ? { ...t, status: newStatus } : t)
    );
    statusMutation.mutate({ id: task._id, status: newStatus });
  };

  return (
    <PageWrapper title="Task Management" description="Drag tasks between columns or click to view details.">
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
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)} className="shadow-lg shadow-brand-500/20">
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 gap-4">
              {COLUMNS.map((col) => (
                <DroppableColumn
                  key={col.id}
                  col={col}
                  tasks={tasks.filter((t) => t.status === col.id)}
                  canCreate={canCreate}
                  onTaskClick={setSelectedTask}
                />
              ))}
            </div>

            {/* Drag overlay — ghost card while dragging */}
            <DragOverlay>
              {draggingTask && (
                <div className="rotate-2 scale-105 opacity-95 shadow-2xl">
                  <Card>
                    <CardBody className="p-4">
                      <h4 className="font-semibold text-slate-900">{draggingTask.title}</h4>
                      {draggingTask.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{draggingTask.description}</p>
                      )}
                    </CardBody>
                  </Card>
                </div>
              )}
            </DragOverlay>
          </DndContext>
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

// ── Create Task Modal ─────────────────────────────────────────
function CreateTaskModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibleTo, setVisibleTo] = useState<UserRole[]>([...ALL_ROLES]);
  const canSetVisibility = user?.role === 'President' || user?.role === 'Secretary';

  const toggleRole = (role: UserRole) =>
    setVisibleTo((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);

  const mutation = useMutation({
    mutationFn: (data: { title: string; description?: string; visible_to: UserRole[] }) =>
      api.post('/tasks', data),
    onSuccess: () => { toast.success('Task created'); onSuccess(); },
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
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {canSetVisibility && (
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              <Eye className="mr-1 inline h-3.5 w-3.5" />
              Visible to roles
              <span className="ml-2 text-slate-400">(President &amp; Secretary always see all)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => {
                const checked = visibleTo.includes(role);
                return (
                  <button key={role} type="button" onClick={() => toggleRole(role)}
                    className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                      checked ? ROLE_COLORS[role] + ' shadow-sm' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300',
                    )}
                  >
                    {checked ? '✓ ' : ''}{role}
                  </button>
                );
              })}
            </div>
            {visibleTo.length === 0 && <p className="mt-1.5 text-xs text-red-500">Select at least one role.</p>}
          </div>
        )}

        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate({ title, description, visible_to: visibleTo })}
            loading={mutation.isPending}
            disabled={!title.trim() || visibleTo.length === 0}
          >
            Create Task
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Task Detail Modal ─────────────────────────────────────────
function TaskDetailModal({ task, onClose, onUpdate }: { task: Task; onClose: () => void; onUpdate: () => void }) {
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');

  const statusMutation = useMutation({
    mutationFn: (status: Task['status']) => api.patch(`/tasks/${task._id}`, { status }),
    onSuccess: () => { toast.success('Status updated'); onUpdate(); },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/tasks/${task._id}/comments`, { content, mentions: [] }),
    onSuccess: () => { setComment(''); onUpdate(); },
  });

  return (
    <Modal open onClose={onClose} title="" size="2xl">
      <div className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">{task.title}</h2>
          {task.description && <p className="text-sm leading-relaxed text-slate-600">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            {task.createdBy && <><span>•</span><span>by {task.createdBy.name.first} {task.createdBy.name.last}</span></>}
            {task.visible_to?.length > 0 && task.visible_to.length < ALL_ROLES.length && (
              <div className="ml-auto flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {task.visible_to.map((role) => (
                  <span key={role} className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', ROLE_COLORS[role])}>{role}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Move to</label>
          <div className="flex gap-2">
            {COLUMNS.map((col) => {
              const Icon = col.icon;
              const isActive = task.status === col.id;
              return (
                <button key={col.id} onClick={() => statusMutation.mutate(col.id)} disabled={statusMutation.isPending}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all',
                    isActive && col.color === 'red' && 'border-red-400 bg-red-50 text-red-700 shadow-sm',
                    isActive && col.color === 'slate' && 'border-slate-400 bg-slate-50 text-slate-700 shadow-sm',
                    isActive && col.color === 'blue' && 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm',
                    isActive && col.color === 'green' && 'border-green-400 bg-green-50 text-green-700 shadow-sm',
                    !isActive && 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <Icon className="h-4 w-4" />{col.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Discussion</h4>
            <Badge variant="default" className="bg-slate-100 text-slate-600">{task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</Badge>
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-4">
            {task.comments.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">No comments yet.</p>
              </div>
            ) : (
              task.comments.map((c) => (
                <div key={c._id} className="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                    {c.userId.name?.first?.[0]}{c.userId.name?.last?.[0]}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{c.userId.name?.first} {c.userId.name?.last}</span>
                      <Badge variant="default" className="bg-brand-50 text-brand-700 text-[10px] font-bold">{c.userId.role}</Badge>
                      <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
              {user?.name.first[0]}{user?.name.last[0]}
            </div>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) commentMutation.mutate(comment); }}
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
