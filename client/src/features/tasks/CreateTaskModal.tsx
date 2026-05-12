import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { cn, roleLabel } from '@/lib/utils';
import type { UserRole, User } from '@/types';
import { ALL_ROLES, ROLE_COLORS } from './constants';

export function CreateTaskModal({ sprintId, role, members, onClose, onSuccess }: {
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

  const eligibleMembers = members.filter((m) =>
    m.isActive && (
      role === 'President' ? true :
      role === 'Secretary' ? ['Officer', 'Committee', 'Attendance'].includes(m.role) :
      ['Committee', 'Attendance'].includes(m.role)
    )
  );

  return (
    <Modal open onClose={onClose} title="New Task" size="lg">
      <div className="space-y-4 pt-2">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
        </div>

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
                  {roleLabel(r)}{isLocked ? ' (always)' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {eligibleMembers.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              <Users className="mr-1 inline h-3.5 w-3.5" />Assign members
              <span className="ml-2 text-slate-400">({assignees.length} selected)</span>
            </label>
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
