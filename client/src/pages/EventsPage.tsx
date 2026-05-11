import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody, Modal, Input, StatusBadge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Event, Activity } from '@/types';

const eventSchema = z.object({
  title:       z.string().min(1, 'Required'),
  description: z.string().optional(),
  venue:       z.string().optional(),
  startDate:   z.string().min(1, 'Required'),
  endDate:     z.string().min(1, 'Required'),
  status:      z.enum(['Planning','Ongoing','Completed','Cancelled']).optional(),
});
type EventForm = z.infer<typeof eventSchema>;

const activitySchema = z.object({
  name:        z.string().min(1, 'Required'),
  description: z.string().optional(),
  startTime:   z.string().min(1, 'Required'),
  endTime:     z.string().min(1, 'Required'),
});
type ActivityForm = z.infer<typeof activitySchema>;

const STATUS_OPTIONS = ['Planning','Ongoing','Completed','Cancelled'] as const;

export function EventsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addActivityFor, setAddActivityFor] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return (await api.get<Event[]>(`/events${params}`)).data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Event deleted'); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/events/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });

  return (
    <PageWrapper
      title="Events"
      description={`${events.length} events`}
      actions={<Button size="sm" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />New Event</Button>}
    >
      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand-500 text-white'
                : 'bg-surface-subtle text-slate-500 hover:bg-surface-border'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : events.length === 0 ? (
        <Card><CardBody className="py-16 text-center text-sm text-slate-400">No events found.</CardBody></Card>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <Card key={ev._id}>
              <CardBody className="p-0">
                {/* Event header */}
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{ev.title}</p>
                      <StatusBadge status={ev.status} />
                    </div>
                    {ev.venue && <p className="text-xs text-slate-400 mt-0.5">{ev.venue}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(ev.dateRange.start).toLocaleDateString()} — {new Date(ev.dateRange.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Quick status change */}
                    <select
                      value={ev.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: ev._id, status: e.target.value })}
                      className="rounded border border-surface-border bg-white px-2 py-1 text-xs focus:outline-none focus:border-brand-400"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setEditEvent(ev)} className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => confirm(`Delete "${ev.title}"?`) && deleteMutation.mutate(ev._id)}
                      className="p-1.5 text-slate-400 hover:text-danger transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === ev._id ? null : ev._id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {expandedId === ev._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Activities panel */}
                {expandedId === ev._id && (
                  <div className="border-t border-surface-border px-4 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Activities</p>
                      <Button size="sm" variant="secondary" onClick={() => setAddActivityFor(ev._id)}>
                        <Plus className="h-3.5 w-3.5" />Add Activity
                      </Button>
                    </div>
                    {ev.activities.length === 0 ? (
                      <p className="text-xs text-slate-400">No activities yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {ev.activities.map((act) => (
                          <ActivityRow key={act._id} activity={act} eventId={ev._id} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <EventFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['events'] }); setFormOpen(false); }}
      />
      {editEvent && (
        <EventFormModal
          open
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['events'] }); setEditEvent(null); }}
        />
      )}
      {addActivityFor && (
        <ActivityFormModal
          open
          eventId={addActivityFor}
          onClose={() => setAddActivityFor(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['events'] }); setAddActivityFor(null); }}
        />
      )}
    </PageWrapper>
  );
}

function ActivityRow({ activity, eventId }: { activity: Activity; eventId: string }) {
  const qc = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/events/${eventId}/activities/${activity._id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{activity.name}</p>
        {activity.description && <p className="text-xs text-slate-400 truncate">{activity.description}</p>}
      </div>
      <select
        value={activity.status}
        onChange={(e) => updateMutation.mutate(e.target.value)}
        className="rounded border border-surface-border bg-white px-2 py-1 text-xs focus:outline-none"
      >
        <option value="Pending">Pending</option>
        <option value="InProgress">In Progress</option>
        <option value="Done">Done</option>
      </select>
    </div>
  );
}

function EventFormModal({ open, event, onClose, onSuccess }: { open: boolean; event?: Event; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!event;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? {
      title: event.title, description: event.description, venue: event.venue,
      startDate: event.dateRange.start.slice(0, 10),
      endDate: event.dateRange.end.slice(0, 10),
      status: event.status,
    } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (v: EventForm) => {
      const body = { title: v.title, description: v.description, venue: v.venue, dateRange: { start: v.startDate, end: v.endDate }, ...(v.status && { status: v.status }) };
      return isEdit ? api.patch(`/events/${event!._id}`, body) : api.post('/events', body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Event updated' : 'Event created'); reset(); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Failed'),
  });

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={isEdit ? 'Edit Event' : 'New Event'} size="lg">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Input label="Title" required error={errors.title?.message} {...register('title')} />
        <Input label="Venue" {...register('venue')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" required error={errors.startDate?.message} {...register('startDate')} />
          <Input label="End Date" type="date" required error={errors.endDate?.message} {...register('endDate')} />
        </div>
        {isEdit && (
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Status</label>
            <select {...register('status')} className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Description</label>
          <textarea {...register('description')} rows={3} className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none" />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Create Event'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ActivityFormModal({ open, eventId, onClose, onSuccess }: { open: boolean; eventId: string; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ActivityForm>({ resolver: zodResolver(activitySchema) });

  const mutation = useMutation({
    mutationFn: (v: ActivityForm) => api.post(`/events/${eventId}/activities`, { name: v.name, description: v.description, startTime: v.startTime, endTime: v.endTime }),
    onSuccess: () => { toast.success('Activity added'); reset(); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Failed'),
  });

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Add Activity">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Input label="Activity Name" required error={errors.name?.message} {...register('name')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" type="datetime-local" required error={errors.startTime?.message} {...register('startTime')} />
          <Input label="End Time" type="datetime-local" required error={errors.endTime?.message} {...register('endTime')} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Description</label>
          <textarea {...register('description')} rows={2} className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none" />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>Add Activity</Button>
        </div>
      </form>
    </Modal>
  );
}
