import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Input, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Sprint } from '@/types';
import { STATUS_COLORS } from './constants';

export function CreateSprintModal({ onClose, onSuccess }: {
  onClose: () => void; onSuccess: (s: Sprint) => void;
}) {
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
    { value: 'Planning',  label: 'Planning',  dot: 'bg-slate-400' },
    { value: 'Active',    label: 'Active',    dot: 'bg-green-500' },
    { value: 'Completed', label: 'Completed', dot: 'bg-blue-500'  },
  ];

  return (
    <Modal open onClose={onClose} title="New Sprint" size="lg">
      <div className="space-y-4 pt-2">
        <Input label="Sprint Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint 1 — May 2026" required />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-2 text-xs font-bold transition-all',
                  status === opt.value
                    ? cn(STATUS_COLORS[opt.value], 'border-current shadow-sm')
                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                )}>
                <span className={cn('h-2 w-2 rounded-full', opt.dot)} />{opt.label}
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
