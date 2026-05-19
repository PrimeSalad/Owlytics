import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, useDroppable, useDraggable,
} from '@dnd-kit/core';
import {
  CheckCircle2, Circle, Clock, Plus, Send, MessageSquare, Users,
  Calendar, Eye, GripVertical, ArrowLeft, Trash2, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Badge, Button, Card, CardBody, Input, Modal, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Task, UserRole, Sprint, User } from '@/types';
import { cn, roleLabel } from '@/lib/utils';
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

const STATUS_COLORS: Record<Sprint['status'], string> = {
  Planning: 'bg-slate-100 text-slate-600',
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-blue-100 text-blue-700',
};


// ── Draggable Card ────────────────────────────────────────────
function DraggableCard({ task, canCreate, onClick }: { task: Task; canCreate: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn('rounded-xl outline-none', isDragging && 'opacity-40')}>
      <Card className="group cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:-translate-y-0.5" onClick={isDragging ? undefined : onClick}>
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
                      <Eye className="h-2.5 w-2.5" />{roleLabel(role)}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MessageSquare className="h-3.5 w-3.5" /><span>{task.comments.length}</span>
                </div>
                {task.assignees.length > 0 && (
                  <div className="ml-auto flex -space-x-1.5">
                    {task.assignees.slice(0, 4).map((a) => (
                      <div key={a._id} title={`${a.name.first} ${a.name.last}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-[9px] font-bold text-white">
                        {a.name.first[0]}{a.name.last[0]}
                      </div>
                    ))}
                    {task.assignees.length > 4 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600">
                        +{task.assignees.length - 4}
                      </div>
                    )}
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
function DroppableColumn({ col, tasks, canCreate, onTaskClick }: {
  col: typeof COLUMNS[number]; tasks: Task[]; canCreate: boolean; onTaskClick: (t: Task) => void;
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
      <div ref={setNodeRef} className={cn('min-h-[120px] space-y-3 rounded-xl p-2 transition-colors', isOver && 'bg-brand-50 ring-2 ring-brand-300 ring-dashed')}>
        {tasks.length === 0 ? (
          <div className={cn('rounded-xl border-2 border-dashed py-8 text-center transition-colors', isOver ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50')}>
            <p className="text-xs text-slate-400">{isOver ? 'Drop here' : 'No tasks'}</p>
          </div>
        ) : tasks.map((task) => (
          <DraggableCard key={task._id} task={task} canCreate={canCreate} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
}


import mascot from '@/assets/mascot2.png';

// ── Main Page ─────────────────────────────────────────────────
export function TasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const canManage = user?.role === 'President' || user?.role === 'Secretary' || user?.role === 'Officer';
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: sprints = [], isLoading: sprintsLoading } = useQuery({
    queryKey: ['sprints'],
    queryFn: async () => (await api.get<Sprint[]>('/sprints')).data,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', activeSprint?._id],
    queryFn: async () => (await api.get<Task[]>(`/tasks?sprint_id=${activeSprint!._id}`)).data,
    enabled: !!activeSprint,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/users')).data,
    enabled: !!activeSprint && (user?.role === 'President' || user?.role === 'Secretary' || user?.role === 'Officer'),
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sprints/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      setActiveSprint(null);
      toast.success('Sprint deleted');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) => api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint?._id] }),
    onError: () => toast.error('Failed to move task'),
  });

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingTask(tasks.find((t) => t._id === e.active.id) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingTask(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as Task['status'];
    const task = tasks.find((t) => t._id === active.id);
    if (!task || task.status === newStatus) return;
    queryClient.setQueryData<Task[]>(['tasks', activeSprint?._id], (old = []) =>
      old.map((t) => t._id === task._id ? { ...t, status: newStatus } : t)
    );
    statusMutation.mutate({ id: task._id, status: newStatus });
  };

  const [msgIndex, setMsgIndex] = useState(0);

  const mascotLines = sprints.length === 0
    ? [
        "Let's get organized. Create your first sprint.",
        "No sprints, no progress. Start one now.",
        "A blank board is just a plan waiting to happen.",
        "Every great project starts with a single sprint.",
      ]
    : sprints.some(s => s.status === 'Active')
    ? [
        "You have active sprints. Keep the momentum going.",
        "Tasks don't complete themselves. Let's move.",
        "Pick a sprint and let's get to work.",
        "Focus on one sprint at a time. You got this.",
        "Progress is made one task at a time.",
        "Stay consistent. Open a sprint and push forward.",
      ]
    : [
        "All sprints are in planning. Time to activate one.",
        "Ready when you are. Pick a sprint to begin.",
        "Plans are nothing without execution. Open a sprint.",
        "A plan without action is just a wish.",
      ];

  useEffect(() => {
    setMsgIndex(0);
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % mascotLines.length), 4000);
    return () => clearInterval(t);
  }, [sprints.length]);

  // ── Sprint Selector Screen ────────────────────────────────
  if (!activeSprint) {
    return (
      <PageWrapper title="Task Management" description="Pick a sprint to open its board.">
        <div className="space-y-6">

          {/* Hero banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1f17] to-[#1a3a28] px-6 py-6">
            <div className="relative z-10 flex items-end justify-between gap-4 sm:items-center">
              {/* Left: text */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-1">Sprint Board</p>
                <h2 className="text-lg font-bold text-white leading-snug sm:text-xl sm:whitespace-nowrap">
                  Hey {user?.name.first}, ready to get things done?
                </h2>
                <p className="mt-1.5 text-xs text-white/50 leading-relaxed">
                  {sprints.length === 0
                    ? 'No sprints yet. Create one to start organizing tasks.'
                    : `${sprints.filter(s => s.status === 'Active').length} active · ${sprints.filter(s => s.status === 'Planning').length} planning · ${sprints.filter(s => s.status === 'Completed').length} completed`}
                </p>
                {canManage && (
                  <button
                    onClick={() => setCreateSprintOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-400 active:scale-95"
                  >
                    <Plus className="h-4 w-4" /> New Sprint
                  </button>
                )}
              </div>

              {/* Right: mascot + bubble */}
              <div className="relative flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:items-center">
                {/* bubble — above on mobile, left on desktop */}
                <div className="relative w-[150px] sm:w-[280px] rounded-2xl rounded-br-sm bg-white/10 px-3 sm:px-5 py-2 sm:py-3 backdrop-blur-sm border border-white/10 shadow-lg sm:rounded-br-sm sm:rounded-bl-none">
                  <p key={msgIndex} className="text-[11px] sm:text-sm font-medium leading-relaxed text-white/90 text-center animate-fade-up">
                    {mascotLines[msgIndex]}
                  </p>
                  {/* tail: down on mobile, right on desktop */}
                  <div className="absolute bottom-[-7px] left-1/2 -translate-x-1/2 h-0 w-0 border-x-[7px] border-t-[7px] border-x-transparent border-t-white/10 sm:hidden" />
                  <div className="hidden sm:block absolute right-[-8px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[7px] border-l-[8px] border-y-transparent border-l-white/10" />
                </div>
                <img src={mascot} alt="" className="h-24 w-24 sm:h-32 sm:w-32 object-contain drop-shadow-2xl select-none pointer-events-none" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />
          </div>

          {sprintsLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : sprints.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
              <img src={mascot} alt="" className="mb-4 h-20 w-20 object-contain opacity-30 select-none" />
              <p className="font-semibold text-slate-500">No sprints yet</p>
              <p className="mt-1 text-sm text-slate-400">Create a sprint to start organizing tasks.</p>
              {canManage && (
                <button onClick={() => setCreateSprintOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-400">
                  <Plus className="h-4 w-4" /> Create First Sprint
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {sprints.map((sprint) => (
                <div
                  key={sprint._id}
                  onClick={() => setActiveSprint(sprint)}
                  className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-brand-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {/* Status pill */}
                  <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-3', STATUS_COLORS[sprint.status])}>
                    {sprint.status}
                  </span>

                  <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">{sprint.name}</h3>
                  {sprint.goal && <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">{sprint.goal}</p>}

                  {(sprint.startDate || sprint.endDate) && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{sprint.startDate ? new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                      <span className="text-slate-300">→</span>
                      <span>{sprint.endDate ? new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open board →
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
                  </div>

                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete sprint "${sprint.name}"? All its tasks will also be deleted.`)) {
                          deleteSprintMutation.mutate(sprint._id);
                        }
                      }}
                      className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {createSprintOpen && (
          <CreateSprintModal
            onClose={() => setCreateSprintOpen(false)}
            onSuccess={(sprint) => {
              queryClient.invalidateQueries({ queryKey: ['sprints'] });
              setCreateSprintOpen(false);
              setActiveSprint(sprint);
            }}
          />
        )}
      </PageWrapper>
    );
  }

  // ── Kanban Board ──────────────────────────────────────────
  return (
    <PageWrapper
      title={activeSprint.name}
      description={activeSprint.goal ?? 'Drag tasks between columns to update status.'}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveSprint(null)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition">
              <ArrowLeft className="h-4 w-4" /> Sprints
            </button>
            <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', STATUS_COLORS[activeSprint.status])}>
              {activeSprint.status}
            </span>
            <div className="flex gap-2">
              {COLUMNS.map((col) => {
                const displayTasks = onlyMine ? tasks.filter((t) => t.assignees.some((a) => a._id === user?._id)) : tasks;
                const count = displayTasks.filter((t) => t.status === col.id).length;
                const Icon = col.icon;
                return (
                  <div key={col.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm">
                    <Icon className={cn('h-3.5 w-3.5', `text-${col.color}-600`)} />
                    <span className="font-semibold text-slate-600">{col.label}</span>
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {canManage && (
            <Button onClick={() => setCreateTaskOpen(true)} className="shadow-lg shadow-brand-500/20">
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          )}
        </div>

        {/* Assigned-to-me filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyMine((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
              onlyMine
                ? 'border-brand-400 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            {onlyMine ? 'Showing: Assigned to me' : 'Filter: Assigned to me'}
          </button>
          {onlyMine && (
            <span className="text-xs text-slate-400">
              {tasks.filter((t) => t.assignees.some((a) => a._id === user?._id)).length} task{tasks.filter((t) => t.assignees.some((a) => a._id === user?._id)).length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {tasksLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {COLUMNS.map((col) => {
                const filteredTasks = onlyMine
                  ? tasks.filter((t) => t.assignees.some((a) => a._id === user?._id))
                  : tasks;
                return (
                  <DroppableColumn key={col.id} col={col} tasks={filteredTasks.filter((t) => t.status === col.id)} canCreate={canManage} onTaskClick={setSelectedTask} />
                );
              })}
            </div>
            <DragOverlay>
              {draggingTask && (
                <div className="rotate-2 scale-105 opacity-95 shadow-2xl">
                  <Card><CardBody className="p-4">
                    <h4 className="font-semibold text-slate-900">{draggingTask.title}</h4>
                    {draggingTask.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{draggingTask.description}</p>}
                  </CardBody></Card>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {createTaskOpen && (
        <CreateTaskModal
          sprintId={activeSprint._id}
          role={user!.role}
          members={members}
          onClose={() => setCreateTaskOpen(false)}
          onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint._id] }); setCreateTaskOpen(false); }}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={members}
          canAssign={canManage}
          creatorRole={user!.role}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint._id] })}
        />
      )}
    </PageWrapper>
  );
}


// ── Create Sprint Modal ───────────────────────────────────────
function CreateSprintModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (s: Sprint) => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState<Sprint['status']>('Planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post<Sprint>('/sprints', { name, goal, status, startDate: startDate || undefined, endDate: endDate || undefined }),
    onSuccess: (res) => { toast.success('Sprint created'); onSuccess(res.data); },
    onError: () => toast.error('Failed to create sprint'),
  });

  const STATUS_OPTIONS: { value: Sprint['status']; label: string; dot: string }[] = [
    { value: 'Planning',  label: 'Planning',  dot: 'bg-slate-400'   },
    { value: 'Active',    label: 'Active',    dot: 'bg-green-500'   },
    { value: 'Completed', label: 'Completed', dot: 'bg-blue-500'    },
  ];

  return (
    <Modal open onClose={onClose} title="New Sprint" size="lg">
      <div className="space-y-4 pt-2">
        <Input label="Sprint Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint 1 — May 2026" required />

        {/* Status dropdown */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-2 text-xs font-bold transition-all',
                  status === opt.value
                    ? cn(STATUS_COLORS[opt.value], 'border-current shadow-sm')
                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', opt.dot)} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Goal <span className="text-slate-400">(optional)</span></label>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What should this sprint achieve?" rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </div>
        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!name.trim()}>Create Sprint</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Create Task Modal ─────────────────────────────────────────
function CreateTaskModal({ sprintId, role, members, onClose, onSuccess }: {
  sprintId: string; role: UserRole; members: User[]; onClose: () => void; onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);

  const LOCKED: Record<string, UserRole[]> = {
    President: ['President'],
    Secretary: ['President', 'Secretary'],
    Officer:   ['President', 'Secretary', 'Officer'],
  };
  const locked = LOCKED[role] ?? ['President'];

  const [visibleTo, setVisibleTo] = useState<UserRole[]>([...locked]);

  const toggleRole = (r: UserRole) => {
    if (locked.includes(r)) return;
    setVisibleTo((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const toggleAssignee = (id: string) =>
    setAssignees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const mutation = useMutation({
    mutationFn: () => api.post('/tasks', { title, description, sprint_id: sprintId, visible_to: visibleTo, assignees }),
    onSuccess: () => { toast.success('Task created'); onSuccess(); },
    onError: () => toast.error('Failed to create task'),
  });

  return (
    <Modal open onClose={onClose} title="New Task" size="lg">
      <div className="space-y-4 pt-2">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
        </div>

        {/* Visibility filter — locked roles can't be toggled */}
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600">
            <Eye className="mr-1 inline h-3.5 w-3.5" />Visible to roles
            <span className="ml-2 text-slate-400">(highlighted = always included)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((r) => {
              const isLocked  = locked.includes(r);
              const isChecked = visibleTo.includes(r);
              return (
                <button key={r} type="button" onClick={() => toggleRole(r)}
                  className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                    isLocked  ? ROLE_COLORS[r] + ' cursor-not-allowed opacity-80' :
                    isChecked ? ROLE_COLORS[r] + ' shadow-sm' :
                                'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                  )}>
                  {r}{isLocked ? ' (always)' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assign members — Secretary/Officer cannot assign President */}
        {members.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              <Users className="mr-1 inline h-3.5 w-3.5" />Assign members
              <span className="ml-2 text-slate-400">({assignees.length} selected)</span>
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {members
                .filter((m) => m.isActive && (role === 'President' ? true : role === 'Secretary' ? (m.role === 'Officer' || m.role === 'Committee' || m.role === 'Attendance') : (m.role === 'Committee' || m.role === 'Attendance')))
                .map((m) => {
                const selected = assignees.includes(m._id);
                return (
                  <button key={m._id} type="button" onClick={() => toggleAssignee(m._id)}
                    className={cn('flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50',
                      selected && 'bg-brand-50'
                    )}>
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                      selected ? 'bg-brand-500' : 'bg-slate-300'
                    )}>
                      {m.name.first[0]}{m.name.last[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{m.name.first} {m.name.last}</p>
                      <p className="text-[10px] text-slate-400">{roleLabel(m.role)}</p>
                    </div>
                    {selected && <span className="text-xs font-bold text-brand-600">Assigned</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!title.trim()}>Create Task</Button>
        </div>
      </div>
    </Modal>
  );
}


// ── Task Detail Modal ─────────────────────────────────────────
function TaskDetailModal({ task, members, canAssign, creatorRole, onClose, onUpdate }: {
  task: Task; members: User[]; canAssign: boolean; creatorRole: UserRole; onClose: () => void; onUpdate: () => void;
}) {
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [assignees, setAssignees] = useState<string[]>(task.assignees.map((a) => a._id));
  const [editingAssignees, setEditingAssignees] = useState(false);

  const statusMutation = useMutation({
    mutationFn: (status: Task['status']) => api.patch(`/tasks/${task._id}`, { status }),
    onSuccess: () => { toast.success('Status updated'); onUpdate(); },
  });

  const assignMutation = useMutation({
    mutationFn: (ids: string[]) => api.patch(`/tasks/${task._id}`, { assignees: ids }),
    onSuccess: () => { toast.success('Assignees updated'); setEditingAssignees(false); onUpdate(); },
    onError: () => toast.error('Failed to update assignees'),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/tasks/${task._id}/comments`, { content, mentions: [] }),
    onSuccess: () => { setComment(''); onUpdate(); },
  });

  const toggleAssignee = (id: string) =>
    setAssignees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <Modal open onClose={onClose} title="" size="2xl">
      <div className="space-y-5">
        <div className="space-y-2">
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
                  className={cn('flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all',
                    isActive && col.color === 'red' && 'border-red-400 bg-red-50 text-red-700 shadow-sm',
                    isActive && col.color === 'blue' && 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm',
                    isActive && col.color === 'green' && 'border-green-400 bg-green-50 text-green-700 shadow-sm',
                    !isActive && 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                  )}>
                  <Icon className="h-4 w-4" />{col.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignees */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              <Users className="mr-1 inline h-3.5 w-3.5" />Assignees
            </h4>
            {canAssign && !editingAssignees && (
              <button onClick={() => setEditingAssignees(true)} className="text-xs font-medium text-brand-600 hover:underline">Edit</button>
            )}
            {canAssign && editingAssignees && (
              <div className="flex gap-2">
                <button onClick={() => { setAssignees(task.assignees.map((a) => a._id)); setEditingAssignees(false); }}
                  className="text-xs text-slate-400 hover:underline">Cancel</button>
                <button onClick={() => assignMutation.mutate(assignees)}
                  className="text-xs font-bold text-brand-600 hover:underline">Save</button>
              </div>
            )}
          </div>

          {!editingAssignees ? (
            task.assignees.length === 0
              ? <p className="text-xs text-slate-400">No assignees yet.</p>
              : <div className="flex flex-wrap gap-2">
                  {task.assignees.map((a) => (
                    <div key={a._id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
                        {a.name.first[0]}{a.name.last[0]}
                      </div>
                      {a.name.first} {a.name.last}
                      <span className="text-[10px] text-slate-400">· {roleLabel(a.role)}</span>
                    </div>
                  ))}
                </div>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {members.filter((m) => m.isActive && (creatorRole === 'President' ? true : creatorRole === 'Secretary' ? (m.role === 'Officer' || m.role === 'Committee' || m.role === 'Attendance') : (m.role === 'Committee' || m.role === 'Attendance'))).map((m) => {
                const selected = assignees.includes(m._id);
                return (
                  <button key={m._id} type="button" onClick={() => toggleAssignee(m._id)}
                    className={cn('flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50', selected && 'bg-brand-50')}>
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', selected ? 'bg-brand-500' : 'bg-slate-300')}>
                      {m.name.first[0]}{m.name.last[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{m.name.first} {m.name.last}</p>
                      <p className="text-[10px] text-slate-400">{roleLabel(m.role)}</p>
                    </div>
                    {selected && <span className="text-xs font-bold text-brand-600">Assigned</span>}
                  </button>
                );
              })}
            </div>
          )}
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
            ) : task.comments.map((c) => (
              <div key={c._id} className="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                  {c.userId.name?.first?.[0]}{c.userId.name?.last?.[0]}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{c.userId.name?.first} {c.userId.name?.last}</span>
                    <Badge variant="default" className="bg-brand-50 text-brand-700 text-[10px] font-bold">{roleLabel(c.userId.role)}</Badge>
                    <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
              {user?.name.first[0]}{user?.name.last[0]}
            </div>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..."
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) commentMutation.mutate(comment); }} />
            <Button size="sm" onClick={() => comment.trim() && commentMutation.mutate(comment)} loading={commentMutation.isPending} disabled={!comment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
