import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import { ImageUploader, type ImageFile } from './ImageUploader';
import { useCreateReport, useEvents } from './useReports';
import type { Event } from '@/types';

const schema = z.object({
  eventId:    z.string().min(1, 'Required'),
  activityId: z.string().optional(),
  type:       z.enum(['Update', 'Emergency', 'Accomplishment']),
  title:      z.string().min(1, 'Required').max(200),
  content:    z.string().min(10, 'Min 10 characters').max(5000),
  objective:  z.string().max(500).optional(),
  duration:   z.string().max(200).optional(),
  remarks:    z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

const TYPE_CONFIG = {
  Accomplishment: { color: 'bg-brand-500 text-white border-brand-500', idle: 'border-slate-200 text-slate-600 hover:border-brand-300' },
  Update:         { color: 'bg-sky-500 text-white border-sky-500',     idle: 'border-slate-200 text-slate-600 hover:border-sky-300' },
  Emergency:      { color: 'bg-red-500 text-white border-red-500',     idle: 'border-slate-200 text-slate-600 hover:border-red-300' },
} as const;

const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400';

interface Props { open: boolean; onClose: () => void; onSuccess: () => void }

export function ReportSubmitModal({ open, onClose, onSuccess }: Props) {
  const [images, setImages]   = useState<ImageFile[]>([]);
  const { data: events = [] } = useEvents();
  const createReport          = useCreateReport();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'Accomplishment' },
  });

  const selectedEventId = watch('eventId');
  const selectedEvent   = events.find((e: Event) => e._id === selectedEventId);
  const content         = watch('content') ?? '';
  const reportType      = watch('type');

  function handleClose() { reset(); setImages([]); onClose(); }

  async function submit(values: FormValues, status: 'Draft' | 'Submitted') {
    const fd = new FormData();
    fd.append('data', JSON.stringify({ ...values, status }));
    images.forEach((img) => fd.append('images', img.file));
    fd.append('captions', JSON.stringify(images.map((i) => i.caption)));
    try {
      await createReport.mutateAsync(fd);
      toast.success(status === 'Draft' ? 'Saved as draft' : 'Report submitted!');
      handleClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Failed to submit');
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Report" size="xl">
      <form onSubmit={handleSubmit((v) => submit(v, 'Submitted'))}>
        <div className="max-h-[72vh] overflow-y-auto pr-1 space-y-3">

          {/* Row 1: Type pills */}
          <div className="flex gap-2">
            {(['Accomplishment', 'Update', 'Emergency'] as const).map((t) => {
              const active = reportType === t;
              return (
                <label key={t} className="flex-1 cursor-pointer">
                  <input type="radio" value={t} {...register('type')} className="sr-only" />
                  <div className={`text-center text-xs font-semibold py-1.5 rounded-lg border transition-all ${active ? TYPE_CONFIG[t].color : TYPE_CONFIG[t].idle}`}>
                    {t}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Row 2: Event + Activity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Event <span className="text-red-400">*</span></label>
              <select {...register('eventId')} className={field}>
                <option value="">Select event…</option>
                {events.map((e: Event) => <option key={e._id} value={e._id}>{e.title}</option>)}
              </select>
              {errors.eventId && <p className="text-[10px] text-red-500 mt-0.5">{errors.eventId.message}</p>}
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Activity</label>
              <select {...register('activityId')} disabled={!selectedEvent} className={`${field} disabled:opacity-40`}>
                <option value="">General / None</option>
                {selectedEvent?.activities?.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Title */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Title <span className="text-red-400">*</span></label>
            <input {...register('title')} placeholder="Report title…" className={field} />
            {errors.title && <p className="text-[10px] text-red-500 mt-0.5">{errors.title.message}</p>}
          </div>

          {/* Row 4: Narrative */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-500">Narrative <span className="text-red-400">*</span></label>
              <span className="text-[10px] text-slate-400">{content.length}/5000</span>
            </div>
            <textarea
              {...register('content')}
              rows={4}
              placeholder="Describe what happened, what was accomplished…"
              className={`${field} resize-none`}
            />
            {errors.content && <p className="text-[10px] text-red-500 mt-0.5">{errors.content.message}</p>}
          </div>

          {/* Accomplishment-only fields */}
          {reportType === 'Accomplishment' && (
            <>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Objective</label>
                <textarea
                  {...register('objective')}
                  rows={2}
                  placeholder="State the objective of this activity…"
                  className={`${field} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">Duration</label>
                  <input {...register('duration')} placeholder="e.g. May 18, 2026 (8AM–5PM)" className={field} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">Remarks</label>
                  <input {...register('remarks')} placeholder="e.g. Successfully conducted" className={field} />
                </div>
              </div>
            </>
          )}

          {/* Photos */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">Photos (up to 5)</label>
            <ImageUploader value={images} onChange={setImages} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-3 mt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={createReport.isPending}
            onClick={handleSubmit((v) => submit(v, 'Draft'))}
          >
            Save Draft
          </Button>
          <Button type="submit" size="sm" loading={createReport.isPending}>Submit</Button>
        </div>
      </form>
    </Modal>
  );
}
