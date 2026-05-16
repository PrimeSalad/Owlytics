import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal, Button, Input } from '@/components/ui';
import { ImageUploader, type ImageFile } from './ImageUploader';
import { useCreateReport, useEvents } from './useReports';
import type { Event } from '@/types';

const schema = z.object({
  eventId:    z.string().min(1, 'Required'),
  activityId: z.string().optional(),
  type:       z.enum(['Update', 'Emergency', 'Accomplishment']),
  title:      z.string().min(1, 'Required').max(200),
  content:    z.string().min(10, 'Min 10 characters').max(5000),
});
type FormValues = z.infer<typeof schema>;

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
    <Modal open={open} onClose={handleClose} title="Submit Report" size="xl">
      <form onSubmit={handleSubmit((v) => submit(v, 'Submitted'))} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Event <span className="text-red-500">*</span></label>
            <select {...register('eventId')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
              <option value="">Select event…</option>
              {events.map((e: Event) => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
            {errors.eventId && <p className="text-xs text-red-500 mt-1">{errors.eventId.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Activity</label>
            <select {...register('activityId')} disabled={!selectedEvent} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400 disabled:opacity-50">
              <option value="">General / No activity</option>
              {selectedEvent?.activities?.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Report Type</label>
          <div className="flex gap-3 flex-wrap">
            {(['Accomplishment', 'Update', 'Emergency'] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" value={t} {...register('type')} className="accent-brand-500" />
                <span className="text-sm text-slate-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <Input label="Title" required error={errors.title?.message} {...register('title')} />

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-600">Narrative <span className="text-red-500">*</span></label>
            <span className="text-[10px] text-slate-400">{content.length} / 5000</span>
          </div>
          <textarea
            {...register('content')}
            rows={5}
            placeholder="Describe what happened, what was accomplished…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
          />
          {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">Photos (up to 5)</label>
          <ImageUploader value={images} onChange={setImages} />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            type="button"
            variant="secondary"
            loading={createReport.isPending}
            onClick={handleSubmit((v) => submit(v, 'Draft'))}
          >
            Save Draft
          </Button>
          <Button type="submit" loading={createReport.isPending}>Submit</Button>
        </div>
      </form>
    </Modal>
  );
}
