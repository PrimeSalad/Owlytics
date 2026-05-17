import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, CalendarDays, MapPin, Clock } from 'lucide-react';

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
      <div className="flex gap-2 flex-wrap mb-2">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
              statusFilter === s
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {s || 'All Events'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : events.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <CalendarDays className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-800 tracking-tight">No events found</h3>
          <p className="mt-1 text-sm text-slate-500">Get started by creating a new event.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <Card key={ev._id} className="flex flex-col">
              <CardBody className="p-0 flex-1 flex flex-col">
                {/* Event header */}
                <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-display text-lg font-bold text-slate-800 tracking-tight leading-tight">{ev.title}</p>
                      <StatusBadge status={ev.status} />
                    </div>
                    {ev.venue && <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{ev.venue}</p>}
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(ev.dateRange.start).toLocaleDateString()} — {new Date(ev.dateRange.end).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 flex items-center justify-between mt-auto">
                  <select
                    value={ev.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: ev._id, status: e.target.value })}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditEvent(ev)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all" title="Edit Event">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => confirm(`Delete "${ev.title}"?`) && deleteMutation.mutate(ev._id)}
                      className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger-50 rounded-lg transition-all" title="Delete Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === ev._id ? null : ev._id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all" title="View Activities"
                    >
                      {expandedId === ev._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Activities panel */}
                {expandedId === ev._id && (
                  <div className="border-t border-slate-200 px-5 pb-5 pt-4 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activities</p>
                      <Button size="sm" variant="secondary" onClick={() => setAddActivityFor(ev._id)} className="h-7 text-[10px] px-2">
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>
                    {ev.activities.length === 0 ? (
                      <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[11px] font-medium text-slate-400">No activities scheduled.</p>
                      </div>
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

nt="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>Add Activity</Button>
        </div>
      </form>
    </Modal>
  );
}

