import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Calendar, Eye, MessageSquare, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { cn, roleLabel, resolveRole } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Task, UserRole, User } from '@/types';
import { ALL_ROLES, COLUMNS, ROLE_COLORS } from './constants';

export function TaskDetailModal({ task, members, canAssign, creatorRole, onClose, onUpdate }: {
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

  const eligibleMembers = members.filter((m) =>
    m.isActive && (
      resolveRole(creatorRole) === 'President' ? true :
      resolveRole(creatorRole) === 'Secretary' ? ['Officer', 'Committee', 'Attendance'].includes(m.role) :
      ['Committee', 'Attendance'].includes(m.role)
    )
  );

  return (
    <Modal open onClose={onClose} title="" size="2xl">
      <div className="space-y-5">
        {/* Header */}
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
                  <span key={role} className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', ROLE_COLORS[role])}>{roleLabel(role)}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Move to</label>
          <div className="flex gap-2">
            {COLUMNS.map((col) => {
              const Icon = col.icon;
              const isActive = task.status === col.id;
              return (
                <button key={col.id} onClick={() => statusMutation.mutate(col.id)} disabled={statusMutation.isPending}
                  className={cn('flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all',
                    isActive && col.color === 'red'   && 'border-red-400 bg-red-50 text-red-700 shadow-sm',
                    isActive && col.color === 'blue'  && 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm',
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
                <button onClick={() => { setAssignees(task.assignees.map((a) => a._id)); setEditingAssignees(false); }} className="text-xs text-slate-400 hover:underline">Cancel</button>
                <button onClick={() => assignMutation.mutate(assignees)} className="text-xs font-bold text-brand-600 hover:underline">Save</button>
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
              {eligibleMembers.map((m) => {
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

        {/* Comments */}
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
