import { AlertTriangle, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report, ReportStatus } from '@/types';

const STATUS_CONFIG: Record<ReportStatus, { color: string; bar: string; icon: React.ReactNode; label: string }> = {
  Draft:     { color: 'text-slate-500 bg-slate-50 border-slate-200',  bar: 'bg-slate-300',  icon: <FileText className="h-3.5 w-3.5" />,      label: 'Draft' },
  Submitted: { color: 'text-amber-700 bg-amber-50 border-amber-200',  bar: 'bg-amber-400',  icon: <Clock className="h-3.5 w-3.5" />,          label: 'Pending Review' },
  Approved:  { color: 'text-green-700 bg-green-50 border-green-200',  bar: 'bg-green-500',  icon: <CheckCircle2 className="h-3.5 w-3.5" />,   label: 'Approved' },
  Rejected:  { color: 'text-red-700 bg-red-50 border-red-200',        bar: 'bg-red-500',    icon: <XCircle className="h-3.5 w-3.5" />,        label: 'Rejected' },
};

const TYPE_COLORS: Record<string, string> = {
  Accomplishment: 'text-brand-700 bg-brand-50',
  Update:         'text-sky-700 bg-sky-50',
  Emergency:      'text-red-700 bg-red-50',
};

interface Props { report: Report; onClick: () => void }

export function ReportCard({ report, onClick }: Props) {
  const status = report.status ?? 'Submitted';
  const cfg    = STATUS_CONFIG[status];
  const attachments = report.report_attachments ?? [];
  const author = report.profiles
    ? `${report.profiles.first_name} ${report.profiles.last_name}`
    : '—';

  // ── Thumbnail Grid Logic ───────────────────────────────────────────────────
  const renderThumbnails = () => {
    if (attachments.length === 0) return null;

    const count = attachments.length;
    const moreCount = count > 4 ? count - 4 : 0;
    const gridThumbs = attachments.slice(0, 4);

    return (
      <div className="relative h-32 sm:h-40 ml-1 overflow-hidden rounded-tr-2xl">
        {count === 1 && (
          <img src={attachments[0].url} className="w-full h-full object-cover" alt="" />
        )}

        {count === 2 && (
          <div className="grid grid-cols-2 gap-0.5 h-full">
            <img src={attachments[0].url} className="w-full h-full object-cover" alt="" />
            <img src={attachments[1].url} className="w-full h-full object-cover" alt="" />
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-2 gap-0.5 h-full">
            <img src={attachments[0].url} className="w-full h-full object-cover" alt="" />
            <div className="grid grid-rows-2 gap-0.5">
              <img src={attachments[1].url} className="w-full h-full object-cover" alt="" />
              <img src={attachments[2].url} className="w-full h-full object-cover" alt="" />
            </div>
          </div>
        )}

        {count >= 4 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
            {gridThumbs.map((a, i) => (
              <div key={i} className="relative w-full h-full">
                <img src={a.url} className="w-full h-full object-cover" alt="" />
                {i === 3 && moreCount > 0 && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white font-bold text-sm">+{moreCount + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col',
        report.type === 'Emergency' && status !== 'Approved' ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200/70'
      )}
    >
      {/* Status bar */}
      <div className={cn('absolute left-0 top-0 w-1 h-full', cfg.bar)} />

      {/* Grid Thumbnails */}
      {renderThumbnails()}

      <div className="p-3 sm:p-4 pl-4 sm:pl-5 flex flex-col gap-2 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.color)}>
            {cfg.icon} {cfg.label}
          </span>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', TYPE_COLORS[report.type] ?? 'text-slate-600 bg-slate-100')}>
            {report.type}
          </span>
          {report.type === 'Emergency' && !report.is_resolved && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-red-700 bg-red-50">
              <AlertTriangle className="h-3 w-3" /> Unresolved
            </span>
          )}
        </div>

        <p className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{report.title}</p>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{report.content}</p>

        {report.status === 'Rejected' && report.rejection_note && (
          <p className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-1 line-clamp-1">
            ✗ {report.rejection_note}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-700">
              {report.profiles ? `${report.profiles.first_name[0]}${report.profiles.last_name[0]}` : '?'}
            </div>
            <span className="text-[10px] text-slate-500">{author}</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {new Date(report.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
