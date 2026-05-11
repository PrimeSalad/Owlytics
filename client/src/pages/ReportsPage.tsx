import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody, Modal, Input, StatusBadge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
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
      <div className="flex gap-2 flex-wrap mb-2">
        {['', ...REPORT_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
              typeFilter === t ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t || 'All Reports'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <FileText className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-800 tracking-tight">No reports found</h3>
          <p className="mt-1 text-sm text-slate-500">There are no reports matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <Card key={r._id} hover onClick={() => setViewReport(r)} className={cn("flex flex-col relative overflow-hidden", r.type === 'Emergency' && !r.isResolved && "border-danger-200 ring-1 ring-danger-100")}>
              {r.type === 'Emergency' && !r.isResolved && <div className="absolute top-0 left-0 w-1.5 h-full bg-danger-500" />}
              <CardBody className="flex flex-col justify-between gap-4 p-5 h-full">
                <div className="flex items-start gap-3 min-w-0">
                  {r.type === 'Emergency' && !r.isResolved && (
                    <div className="h-8 w-8 rounded-full bg-danger-50 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-danger-600" />
                    </div>
                  )}
                  {r.isResolved && (
                    <div className="h-8 w-8 rounded-full bg-success-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-success-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <StatusBadge status={r.type} />
                      {r.isResolved && <StatusBadge status="Completed" />}
                    </div>
                    <p className="font-display text-base font-bold text-slate-800 tracking-tight truncate">{r.title}</p>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{r.content}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                      {r.authorId.name.first[0]}{r.authorId.name.last[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-600">{r.authorId.name.first} {r.authorId.name.last}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {r.type === 'Emergency' && !r.isResolved && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs px-3 shadow-none border-danger-200 text-danger-700 hover:bg-danger-50"
                      onClick={(e) => { e.stopPropagation(); resolveMutation.mutate(r._id); }}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
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
