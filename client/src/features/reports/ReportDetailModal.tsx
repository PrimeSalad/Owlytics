import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, ChevronLeft, ChevronRight, X, Trash2, ZoomIn, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import { useReport, useApproveReport, useRejectReport, useResolveReport, useDeleteReport } from './useReports';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';
import { api } from '@/lib/api';

interface Props {
  reportId: string | null;
  userRole: UserRole;
  userId: string;
  onClose: () => void;
}

export function ReportDetailModal({ reportId, userRole, userId, onClose }: Props) {
  const { data: report, isLoading } = useReport(reportId);
  const approve  = useApproveReport();
  const reject   = useRejectReport();
  const resolve  = useResolveReport();
  const del      = useDeleteReport();

  const [rejectNote,  setRejectNote]  = useState('');
  const [showReject,  setShowReject]  = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [lightbox,    setLightbox]    = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setRejectNote('');
    setShowReject(false);
    setConfirmDel(false);
    setLightbox(null);
    setIsExporting(false);
  }, [reportId]);

  const canReview = ['Officer', 'Secretary', 'President'].includes(userRole);
  const images    = report?.report_attachments ?? [];
  const isOwner   = report?.author_id === userId;
  const canDelete = isOwner || ['President', 'Secretary'].includes(userRole);

  async function handleExportPDF() {
    if (!reportId) return;
    setIsExporting(true);
    try {
      const res = await api.get(`/reports/${reportId}/export-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleApprove() {
    if (!reportId) return;
    try { await approve.mutateAsync(reportId); toast.success('Report approved'); onClose(); }
    catch { toast.error('Failed to approve'); }
  }

  async function handleReject() {
    if (!reportId || !rejectNote.trim()) return;
    try { await reject.mutateAsync({ id: reportId, note: rejectNote }); toast.success('Report rejected'); onClose(); }
    catch { toast.error('Failed to reject'); }
  }

  async function handleResolve() {
    if (!reportId) return;
    try { await resolve.mutateAsync(reportId); toast.success('Emergency resolved'); onClose(); }
    catch { toast.error('Failed'); }
  }

  async function handleDelete() {
    if (!reportId) return;
    try { await del.mutateAsync(reportId); toast.success('Report deleted'); onClose(); }
    catch { toast.error('Failed to delete'); }
  }

  return (
    <>
      <Modal open={!!reportId} onClose={onClose} title={report?.title ?? '…'} size="xl">
        {isLoading || !report ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Meta row */}
            <div className="flex flex-wrap gap-2 items-start sm:items-center">
              <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full', {
                'bg-amber-50 text-amber-700':  report.status === 'Submitted',
                'bg-green-50 text-green-700':  report.status === 'Approved',
                'bg-red-50 text-red-700':      report.status === 'Rejected',
                'bg-slate-50 text-slate-600':  report.status === 'Draft',
              })}>
                {report.status}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">{report.type}</span>
              <span className="text-xs text-slate-400 sm:ml-auto w-full sm:w-auto">
                {report.profiles ? `${report.profiles.first_name} ${report.profiles.last_name}` : '—'} ·{' '}
                {new Date(report.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>

            {/* Rejection note */}
            {report.status === 'Rejected' && report.rejection_note && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                <strong>Rejection note:</strong> {report.rejection_note}
              </div>
            )}

            {/* Content */}
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-all">{report.content}</p>

            {/* Image grid */}
            {images.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">{images.length} photo{images.length !== 1 ? 's' : ''}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {images
                    .slice()
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((img, i) => (
                      <div
                        key={i}
                        className="group relative cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                        onClick={() => setLightbox(i)}
                      >
                        <img
                          src={img.url}
                          alt={img.caption ?? ''}
                          className="w-full h-28 sm:h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                        </div>
                        {img.caption && (
                          <p className="text-[10px] text-slate-500 px-1 py-0.5 text-center truncate bg-white border-t border-slate-100">
                            {img.caption}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Bottom action bar */}
            {(canReview || canDelete || report.status === 'Approved') && (
              <div className="pt-3 border-t border-slate-100">
                {/* Reject textarea */}
                {showReject && (
                  <div className="space-y-2 mb-3">
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Reason for rejection…"
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
                    />
                  </div>
                )}

                {/* Delete confirm banner */}
                {confirmDel && (
                  <div className="flex flex-wrap items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                    <Trash2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="text-xs text-red-600 font-medium flex-1">Delete this report?</span>
                    <button onClick={() => setConfirmDel(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                    <Button variant="danger" size="sm" className="h-6 px-2 text-xs" loading={del.isPending} onClick={handleDelete}>Delete</Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Trash icon — left side */}
                  {canDelete && !confirmDel && !showReject && (
                    <button
                      onClick={() => setConfirmDel(true)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <div className="flex gap-2 ml-auto flex-wrap justify-end">
                    {report.status === 'Approved' && (
                      <Button variant="secondary" size="sm" loading={isExporting} onClick={handleExportPDF}>
                        <Download className="h-4 w-4" /> Export PDF
                      </Button>
                    )}
                    {canReview && report.type === 'Emergency' && !report.is_resolved && (
                      <Button variant="secondary" size="sm" loading={resolve.isPending} onClick={handleResolve}
                        className="border-orange-200 text-orange-700 hover:bg-orange-50">
                        <AlertTriangle className="h-4 w-4" /> Mark Resolved
                      </Button>
                    )}
                    {canReview && report.status === 'Submitted' && (
                      showReject ? (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => setShowReject(false)}>Cancel</Button>
                          <Button variant="danger" size="sm" loading={reject.isPending} onClick={handleReject} disabled={!rejectNote.trim()}>
                            <XCircle className="h-4 w-4" /> Confirm Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => setShowReject(true)}>
                            <XCircle className="h-4 w-4 text-red-500" /> Reject
                          </Button>
                          <Button size="sm" loading={approve.isPending} onClick={handleApprove}
                            className="bg-green-600 hover:bg-green-700 border-green-700/20">
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </Button>
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Lightbox — rendered via portal to escape Radix Dialog stacking context */}
      {lightbox !== null && images.length > 0 && createPortal(
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightbox + 1} / {images.length}
          </span>

          {/* Prev */}
          {lightbox > 0 && (
            <button
              className="absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightbox].url}
            alt={images[lightbox].caption ?? ''}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          {images[lightbox].caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-4 py-1.5 rounded-full">
              {images[lightbox].caption}
            </p>
          )}

          {/* Next */}
          {lightbox < images.length - 1 && (
            <button
              className="absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
