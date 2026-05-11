import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody, Modal, Input, StatusBadge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Event, Report } from '@/types';

const REPORT_TYPES = ['Update', 'Emergency', 'Accomplishment'] as const;

const reportSchema = z.object({
  eventId:  z.string().min(1, 'Required'),
  type:     z.enum(REPORT_TYPES),
  title:    z.string().min(1, 'Required'),
  content:  z.string().min(1, 'Required'),
});
type ReportForm = z.infer<typeof reportSchema>;

export function ReportsPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', typeFilter],
    queryFn: async () => {
      const params = typeFilter ? `?type=${typeFilter}` : '';
      return (await api.get<Report[]>(`/reports${params}`)).data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/reports/${id}/resolve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); toast.success('Report resolved'); },
  });

  return (
    <PageWrapper
      title="Reports"
      description={`${reports.length} reports`}
      actions={<Button size="sm" onClick={() => setSubmitOpen(true)}><Plus className="h-4 w-4" />New Report</Button>}
    >
      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...REPORT_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === t ? 'bg-brand-500 text-white' : 'bg-surface-subtle text-slate-500 hover:bg-surface-border'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : reports.length === 0 ? (
        <Card><CardBody className="py-16 text-center text-sm text-slate-400">No reports found.</CardBody></Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r._id} hover onClick={() => setViewReport(r)}>
              <CardBody className="flex items-start justify-between gap-4 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  {r.type === 'Emergency' && !r.isResolved && (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  )}
                  {r.isResolved && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{r.title}</p>
                      <StatusBadge status={r.type} />
                      {r.isResolved && <StatusBadge status="Completed" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{r.content}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {r.authorId.name.first} {r.authorId.name.last} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {r.type === 'Emergency' && !r.isResolved && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => { e.stopPropagation(); resolveMutation.mutate(r._id); }}
                  >
                    Resolve
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ReportFormModal
        open={submitOpen}
        events={events}
        onClose={() => setSubmitOpen(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['reports'] }); setSubmitOpen(false); }}
      />

      {viewReport && (
        <Modal open onClose={() => setViewReport(null)} title={viewReport.title} size="lg">
          <div className="space-y-3">
            <div className="flex gap-2">
              <StatusBadge status={viewReport.type} />
              {viewReport.isResolved && <StatusBadge status="Completed" />}
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewReport.content}</p>
            <p className="text-xs text-slate-400">
              Submitted by {viewReport.authorId.name.first} {viewReport.authorId.name.last} · {new Date(viewReport.createdAt).toLocaleString()}
            </p>
            {viewReport.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {viewReport.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
                    Attachment {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}

function ReportFormModal({ open, events, onClose, onSuccess }: {
  open: boolean; events: Event[]; onClose: () => void; onSuccess: () => void;
}) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: { type: 'Update' },
  });

  const mutation = useMutation({
    mutationFn: (v: ReportForm) => api.post('/reports', v),
    onSuccess: () => { toast.success('Report submitted'); reset(); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Failed'),
  });

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Submit Report" size="lg">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Event <span className="text-danger">*</span></label>
          <select {...register('eventId')} className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
            <option value="">Select event</option>
            {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
          {errors.eventId && <p className="text-xs text-danger mt-1">{errors.eventId.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Type <span className="text-danger">*</span></label>
          <select {...register('type')} className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
            {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Input label="Title" required error={errors.title?.message} {...register('title')} />
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Content <span className="text-danger">*</span></label>
          <textarea
            {...register('content')}
            rows={5}
            placeholder="Describe the update, situation, or accomplishment…"
            className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
          />
          {errors.content && <p className="text-xs text-danger mt-1">{errors.content.message}</p>}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>Submit Report</Button>
        </div>
      </form>
    </Modal>
  );
}
