import { useState, useEffect } from 'react';
import { Plus, FileDown, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, Spinner } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useReports, useEvents } from '@/features/reports/useReports';
import { ReportCard } from '@/features/reports/ReportCard';
import { ReportSubmitModal } from '@/features/reports/ReportSubmitModal';
import { ReportDetailModal } from '@/features/reports/ReportDetailModal';
import { CompileReportModal } from '@/features/reports/CompileReportModal';
import type { Event } from '@/types';

const TYPE_FILTERS  = ['', 'Accomplishment', 'Update', 'Emergency'] as const;
const STATUS_FILTERS = ['', 'Submitted', 'Approved', 'Rejected', 'Draft'] as const;


export function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'Committee';

  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter,  setEventFilter]  = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');
  const [submitOpen,   setSubmitOpen]   = useState(false);
  const [compileOpen,  setCompileOpen]  = useState(false);
  const [activeId,     setActiveId]     = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('reportId');
    if (reportId) {
      setActiveId(reportId);
    }
  }, []);

  const { data: rawReports = [], isLoading, refetch } = useReports({
    type:    typeFilter   || undefined,
    status:  statusFilter || undefined,
    eventId: eventFilter  || undefined,
  });
  const STATUS_ORDER: Record<string, number> = { Submitted: 0, Approved: 1, Rejected: 2, Draft: 3 };
  const reports = [...rawReports].sort((a, b) => {
    if (sortBy === 'status') return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return sortBy === 'newest' ? diff : -diff;
  });
  const { data: events = [] } = useEvents();

  const canCompile = ['Secretary', 'President'].includes(role);
  const canReview  = ['Officer', 'Secretary', 'President'].includes(role);

  // Stats
  const pending  = reports.filter((r) => r.status === 'Submitted').length;
  const approved = reports.filter((r) => r.status === 'Approved').length;
  const rejected = reports.filter((r) => r.status === 'Rejected').length;
  const statData = [
    { key: 'Submitted', label: 'Pending',  count: pending,  icon: Clock,        color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { key: 'Approved',  label: 'Approved', count: approved, icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
    { key: 'Rejected',  label: 'Rejected', count: rejected, icon: XCircle,      color: 'text-red-600 bg-red-50 border-red-200' },
  ];

  return (
    <PageWrapper
      title="Reports"
      description={`${reports.length} report${reports.length !== 1 ? 's' : ''}`}
      actions={
        <div className="flex gap-2 flex-wrap justify-end">
          {canCompile && (
            <Button size="sm" variant="secondary" onClick={() => setCompileOpen(true)}>
              <FileDown className="h-4 w-4" /> Compile
            </Button>
          )}
          <Button size="sm" onClick={() => setSubmitOpen(true)}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Report</span><span className="sm:hidden">New</span>
          </Button>
        </div>
      }
    >
      {/* Stats row — only for reviewers */}
      {canReview && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {statData.map(({ key, label, count, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all ${
                statusFilter === key ? color + ' ring-1 ring-current/20' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${statusFilter === key ? '' : 'text-slate-400'}`} />
              <div className="text-left min-w-0">
                <p className={`text-lg sm:text-xl font-bold leading-none ${statusFilter === key ? '' : 'text-slate-800'}`}>{count}</p>
                <p className={`text-[9px] sm:text-[10px] font-medium mt-0.5 truncate ${statusFilter === key ? '' : 'text-slate-500'}`}>{label}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Type pills */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                typeFilter === t
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t || 'All'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 sm:ml-auto">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'status')}
            className="flex-1 sm:flex-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:border-brand-400"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="status">Status</option>
          </select>

          {/* Event filter */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="flex-1 sm:flex-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:border-brand-400"
          >
            <option value="">All Events</option>
            {events.map((e: Event) => (
              <option key={e._id} value={e._id}>{e.title}</option>
            ))}
          </select>

          {/* Status filter (non-reviewer sees own status) */}
          {!canReview && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:border-brand-400"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>{s || 'All Status'}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <FileText className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-semibold text-lg text-slate-800">No reports found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {typeFilter || statusFilter || eventFilter
              ? 'Try adjusting your filters.'
              : 'Submit the first report for this event.'}
          </p>
          <Button size="sm" className="mt-4" onClick={() => setSubmitOpen(true)}>
            <Plus className="h-4 w-4" /> New Report
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id ?? r._id}
              report={r}
              onClick={() => setActiveId(r.id ?? r._id ?? null)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ReportSubmitModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSuccess={() => { refetch(); setSubmitOpen(false); }}
      />

      <ReportDetailModal
        reportId={activeId}
        userRole={role as any}
        userId={user?._id ?? ''}
        onClose={() => setActiveId(null)}
      />

      {canCompile && (
        <CompileReportModal
          open={compileOpen}
          onClose={() => setCompileOpen(false)}
        />
      )}
    </PageWrapper>
  );
}
