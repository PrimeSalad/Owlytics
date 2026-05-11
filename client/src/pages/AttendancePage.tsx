import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody, Modal, Input, StatusBadge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Event } from '@/types';

const SESSION_LABELS = ['AM In', 'AM Out', 'PM In', 'PM Out'] as const;

const scheduleSchema = z.object({
  eventId: z.string().min(1, 'Required'),
  label:   z.string().min(1, 'Required'),
  sessions: z.array(z.object({
    label:               z.enum(SESSION_LABELS),
    openAt:              z.string().min(1, 'Required'),
    closeAt:             z.string().min(1, 'Required'),
    gracePeriodMinutes:  z.coerce.number().int().min(0).default(15),
  })).min(1, 'Add at least one session'),
});
type ScheduleForm = z.infer<typeof scheduleSchema>;

export function AttendancePage() {
  const qc = useQueryClient();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules', selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => (await api.get(`/attendance/schedules/${selectedEventId}`)).data,
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['records', selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => (await api.get(`/attendance/records/${selectedEventId}`)).data,
  });

  const markAbsentMutation = useMutation({
    mutationFn: (scheduleId: string) => api.post(`/attendance/mark-absent/${scheduleId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['records'] }); toast.success('Absent marking triggered'); },
  });

  return (
    <PageWrapper
      title="Attendance"
      description="Manage schedules and view attendance records."
      actions={<Button size="sm" onClick={() => setScheduleOpen(true)}><Plus className="h-4 w-4" />New Schedule</Button>}
    >
      {/* Event selector */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Select Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400 w-full max-w-sm"
        >
          <option value="">— Choose an event —</option>
          {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Schedules */}
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-700 mb-3">Schedules</h3>
            {isLoading ? <Spinner /> : schedules.length === 0 ? (
              <Card><CardBody className="py-8 text-center text-sm text-slate-400">No schedules yet. Create one above.</CardBody></Card>
            ) : (
              <div className="space-y-2">
                {schedules.map((sch: any) => (
                  <Card key={sch.id}>
                    <CardBody className="p-0">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">{sch.label}</p>
                          <p className="text-xs text-slate-400">{sch.attendance_sessions?.length ?? 0} sessions</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => markAbsentMutation.mutate(sch.id)}>
                            Mark Absent
                          </Button>
                          <button onClick={() => setExpandedSchedule(expandedSchedule === sch.id ? null : sch.id)} className="text-slate-400 hover:text-slate-600">
                            {expandedSchedule === sch.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {expandedSchedule === sch.id && sch.attendance_sessions?.length > 0 && (
                        <div className="border-t border-surface-border px-4 pb-3 pt-2 space-y-1.5">
                          {sch.attendance_sessions.map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between text-sm bg-surface-muted rounded px-3 py-2">
                              <span className="font-medium text-slate-700">{s.label}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(s.open_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(s.close_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' '}· {s.grace_period_minutes}min grace
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Records */}
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-700 mb-3">Attendance Records</h3>
            <Card>
              <CardBody className="p-0">
                {recordsLoading ? (
                  <div className="flex justify-center py-10"><Spinner /></div>
                ) : records.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">No records yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-muted border-b border-surface-border">
                        <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                          <th className="px-5 py-3 font-medium">Student</th>
                          <th className="px-5 py-3 font-medium">Session</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Time</th>
                          <th className="px-5 py-3 font-medium">Scanned By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-surface-muted transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-medium text-slate-800">{r.students?.first_name} {r.students?.last_name}</p>
                              <p className="text-xs text-slate-400">{r.students?.student_id}</p>
                            </td>
                            <td className="px-5 py-3 text-slate-600">{r.session_id}</td>
                            <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                            <td className="px-5 py-3 text-xs text-slate-400">{new Date(r.timestamp).toLocaleString()}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">
                              {r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      <ScheduleFormModal
        open={scheduleOpen}
        events={events}
        defaultEventId={selectedEventId}
        onClose={() => setScheduleOpen(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['schedules'] }); setScheduleOpen(false); }}
      />
    </PageWrapper>
  );
}

function ScheduleFormModal({ open, events, defaultEventId, onClose, onSuccess }: {
  open: boolean; events: Event[]; defaultEventId: string; onClose: () => void; onSuccess: () => void;
}) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { eventId: defaultEventId, sessions: [{ label: 'AM In', openAt: '', closeAt: '', gracePeriodMinutes: 15 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'sessions' });

  const mutation = useMutation({
    mutationFn: (v: ScheduleForm) => api.post('/attendance/schedules', {
      eventId: v.eventId, label: v.label,
      sessions: v.sessions.map((s) => ({ label: s.label, openAt: s.openAt, closeAt: s.closeAt, gracePeriodMinutes: s.gracePeriodMinutes })),
    }),
    onSuccess: () => { toast.success('Schedule created'); reset(); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Failed'),
  });

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="New Attendance Schedule" size="xl">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Event <span className="text-danger">*</span></label>
          <select {...register('eventId')} className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
            <option value="">Select event</option>
            {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        </div>
        <Input label="Schedule Label" placeholder="e.g. Day 1 - Morning" required error={errors.label?.message} {...register('label')} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-600">Sessions</label>
            <Button type="button" size="sm" variant="secondary" onClick={() => append({ label: 'AM In', openAt: '', closeAt: '', gracePeriodMinutes: 15 })}>
              <Plus className="h-3.5 w-3.5" />Add Session
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="rounded-lg border border-surface-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <select {...register(`sessions.${i}.label`)} className="rounded border border-surface-border bg-white px-2 py-1.5 text-sm focus:outline-none">
                    {SESSION_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="text-xs text-danger hover:underline">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Opens At" type="datetime-local" required {...register(`sessions.${i}.openAt`)} />
                  <Input label="Closes At" type="datetime-local" required {...register(`sessions.${i}.closeAt`)} />
                  <Input label="Grace (min)" type="number" {...register(`sessions.${i}.gracePeriodMinutes`)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>Create Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}
