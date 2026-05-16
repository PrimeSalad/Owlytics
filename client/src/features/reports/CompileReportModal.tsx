import { useState, useEffect } from 'react';
import { GripVertical, Download, CheckCircle2, FileText, AlertCircle, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, Spinner } from '@/components/ui';
import { useCompileReport, useCompileReportWord, useExports, useEvents } from './useReports';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { Event, Report, AccomplishmentExport } from '@/types';

interface Props { open: boolean; onClose: () => void }

const STEPS = ['Details', 'Select Event', 'Review', 'Export'];

export function CompileReportModal({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? '';

  // Guard — only President/Secretary
  if (!['President', 'Secretary'].includes(role)) return null;

  const fullName = user ? `${user.name?.first ?? ''} ${user.name?.last ?? ''}`.trim() : '';

  const [step, setStep]                   = useState(0);
  const [presidentName, setPresidentName] = useState('');
  const [secretaryName, setSecretaryName] = useState('');
  const [orgName, setOrgName]             = useState('STUDENT ORGANIZATION');
  const [preparedBy, setPreparedBy]       = useState('');
  const [academicYear, setAcademicYear]   = useState('');
  const [eventId, setEventId]             = useState('');
  const [sections, setSections]           = useState<string[]>([]);
  const [isFinal, setIsFinal]             = useState(false);
  const [dragging, setDragging]           = useState<number | null>(null);

  // Pre-fill names based on role
  useEffect(() => {
    if (fullName) {
      setPreparedBy(fullName.toUpperCase());
      if (role === 'President') {
        setPresidentName(fullName.toUpperCase());
      }
      if (role === 'Secretary') {
        setSecretaryName(fullName.toUpperCase());
      }
    }
  }, [role, fullName]);

  // Pre-fill academic year from current date
  useEffect(() => {
    if (!academicYear) {
      const now = new Date();
      const y = now.getFullYear();
      // Academic year: Aug–Jul cycle
      // If we are in 2026, start is 2026
      const start = now.getMonth() >= 7 ? y : y - 1;
      setAcademicYear('2026 – 2027');
    }
  }, []);


  const { data: events = [] }  = useEvents();
  const compile     = useCompileReport();
  const compileWord = useCompileReportWord();
  const { data: exports = [] } = useExports(eventId || null);

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['reports', { eventId, status: 'Approved', type: 'Accomplishment' }],
    queryFn: () =>
      api.get<Report[]>(`/reports?eventId=${eventId}&status=Approved&type=Accomplishment`).then((r) => r.data),
    enabled: !!eventId,
  });

  const selectedEvent = events.find((e: Event) => e._id === eventId);

  // Build a map of activityId → activity name from the selected event
  const activityNameMap = new Map<string, string>();
  if (selectedEvent?.activities) {
    for (const a of selectedEvent.activities as any[]) {
      activityNameMap.set(a.id ?? a._id, a.name);
    }
  }

  function getSectionLabel(actId: string): string {
    if (actId === '__general__') return 'General Reports';
    return activityNameMap.get(actId) ?? 'Unknown Activity';
  }

  function handleClose() {
    setStep(0); setEventId(''); setSections([]); setIsFinal(false);
    onClose();
  }

  function handleEventSelect(id: string) {
    setEventId(id);
    setSections([]);
    setStep(2);
  }

  function initSections() {
    const ids = [...new Set(reports.map((r) => r.activity_id ?? '__general__'))];
    setSections(ids);
    setStep(3);
  }

  function onDragStart(i: number) { setDragging(i); }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragging === null || dragging === i) return;
    const next = [...sections];
    const [item] = next.splice(dragging, 1);
    next.splice(i, 0, item);
    setSections(next);
    setDragging(i);
  }
  function onDragEnd() { setDragging(null); }

  async function handleExportPDF() {
    if (!presidentName.trim() || !academicYear.trim() || !secretaryName.trim()) {
      toast.error('Please fill in all required fields first.');
      setStep(0);
      return;
    }
    try {
      await compile.mutateAsync({
        eventId,
        sectionOrder: sections,
        isFinal,
        presidentName: presidentName.trim().toUpperCase(),
        secretaryName: secretaryName.trim().toUpperCase(),
        orgName: orgName.trim().toUpperCase(),
        preparedBy: preparedBy.trim().toUpperCase(),
        academicYear: academicYear.trim(),
      });
      toast.success('PDF downloaded!');
      handleClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Export failed');
    }
  }

  async function handleExportWord() {
    if (!presidentName.trim() || !academicYear.trim() || !secretaryName.trim()) {
      toast.error('Please fill in all required fields first.');
      setStep(0);
      return;
    }
    try {
      await compileWord.mutateAsync({
        eventId,
        sectionOrder: sections,
        isFinal,
        presidentName: presidentName.trim().toUpperCase(),
        secretaryName: secretaryName.trim().toUpperCase(),
        orgName: orgName.trim().toUpperCase(),
        preparedBy: preparedBy.trim().toUpperCase(),
        academicYear: academicYear.trim(),
      });
      toast.success('Word document downloaded!');
      handleClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Export failed');
    }
  }

  const canProceedStep0 = 
    presidentName.trim().length > 0 && 
    secretaryName.trim().length > 0 &&
    orgName.trim().length > 0 &&
    academicYear.trim().length > 0;


  return (
    <Modal open={open} onClose={handleClose} title="Compile Accomplishment Report" size="xl">
      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-6">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <button
              onClick={() => { if (i < step) setStep(i); }}
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > i
                  ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                  : step === i
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-default'
              }`}
            >
              {step > i ? '✓' : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 transition-colors ${step > i ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs text-slate-500 font-medium">{STEPS[step]}</span>
      </div>

      {/* ── Step 0: Pre-fill details ── */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-500" />
              Report Information
            </h4>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Fill in the organization and period details. These will appear on the cover page and header of the report.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Org Name */}
            <div className="col-span-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value.toUpperCase())}
                placeholder="e.g. CICS STUDENT ORGANIZATION"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition shadow-sm"
              />
            </div>

            {/* Academic Year */}
            <div className="col-span-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2025 – 2026"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition shadow-sm"
              />
            </div>

            <div className="col-span-2 pt-2 pb-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-brand-500" />
                Signatories
              </h4>
            </div>

            {/* President Name */}
            <div className="col-span-1">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                President <span className="text-red-500">*</span>
              </label>
              <input
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value.toUpperCase())}
                placeholder="JUAN DELA CRUZ"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition shadow-sm"
              />
              {role === 'President' && (
                <p className="text-[10px] text-brand-600 font-medium mt-1.5 flex items-center gap-1 px-1">
                  <CheckCircle2 className="h-3 w-3" /> Auto-filled from your profile
                </p>
              )}
            </div>

            {/* Secretary Name */}
            <div className="col-span-1">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Secretary <span className="text-red-500">*</span>
              </label>
              <input
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value.toUpperCase())}
                placeholder="MARIA CLARA"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition shadow-sm"
              />
              {role === 'Secretary' && (
                <p className="text-[10px] text-brand-600 font-medium mt-1.5 flex items-center gap-1 px-1">
                  <CheckCircle2 className="h-3 w-3" /> Auto-filled from your profile
                </p>
              )}
            </div>

            {/* Prepared By */}
            <div className="col-span-2 mt-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Prepared By
              </label>
              <input
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition shadow-sm opacity-80"
              />
            </div>
          </div>

          {!canProceedStep0 && (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              All asterisk (*) fields are required before you can proceed.
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button size="lg" onClick={() => setStep(1)} disabled={!canProceedStep0} className="px-8 shadow-md">
              Select Event →
            </Button>
          </div>
        </div>
      )}


      {/* ── Step 1: Select event ── */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Choose the event to compile a report for:</p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {events.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">No events found.</div>
            )}
            {events.map((e: Event) => (
              <button
                key={e._id}
                onClick={() => handleEventSelect(e._id)}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-all group"
              >
                <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-700">{e.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(e.dateRange?.start ?? '').toLocaleDateString('en-PH', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {e.dateRange?.end && e.dateRange.end !== e.dateRange.start && (
                    <> – {new Date(e.dateRange.end).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                  )}
                </p>
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setStep(0)}>← Back</Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Review reports ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
            <p className="font-semibold text-brand-800 text-sm">{selectedEvent?.title}</p>
            {loadingReports ? (
              <div className="flex items-center gap-2 mt-1">
                <Spinner size="sm" />
                <span className="text-xs text-slate-500">Loading reports…</span>
              </div>
            ) : (
              <p className="text-xs text-brand-600 mt-0.5">
                {reports.length} approved accomplishment report{reports.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {!loadingReports && reports.length === 0 && (
            <div className="py-8 text-center">
              <FileText className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No approved reports yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Reports must be submitted and approved before they can be compiled.
              </p>
            </div>
          )}

          {reports.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400">
                      {r.profiles
                        ? `${r.profiles.first_name} ${r.profiles.last_name}`
                        : '—'}
                      {' · '}
                      {r.report_attachments?.length ?? 0} photo
                      {(r.report_attachments?.length ?? 0) !== 1 ? 's' : ''}
                      {r.activity_id && activityNameMap.has(r.activity_id) && (
                        <> · <span className="text-brand-500">{activityNameMap.get(r.activity_id)}</span></>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 justify-between pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setStep(1)}>← Back</Button>
            <Button size="sm" onClick={initSections} disabled={reports.length === 0 || loadingReports}>
              Arrange Sections →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Arrange + export ── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex gap-2">
              <span className="font-semibold text-slate-500 w-28">President</span>
              <span className="font-medium text-slate-800">{presidentName}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-slate-500 w-28">Academic Year</span>
              <span className="font-medium text-slate-800">{academicYear}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-slate-500 w-28">Event</span>
              <span className="font-medium text-slate-800 truncate">{selectedEvent?.title}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Drag to reorder sections ({sections.length} section{sections.length !== 1 ? 's' : ''})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sections.map((actId, i) => {
                const sectionReports = reports.filter(
                  (r) => (r.activity_id ?? '__general__') === actId
                );
                const photoCount = sectionReports.reduce(
                  (n, r) => n + (r.report_attachments?.length ?? 0), 0
                );
                return (
                  <div
                    key={actId}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDragEnd={onDragEnd}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white cursor-grab active:cursor-grabbing transition-all select-none ${
                      dragging === i
                        ? 'border-brand-400 bg-brand-50 shadow-sm scale-[1.01]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {getSectionLabel(actId)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {sectionReports.length} report{sectionReports.length !== 1 ? 's' : ''}
                        {photoCount > 0 && ` · ${photoCount} photo${photoCount !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 bg-slate-100 rounded px-1.5 py-0.5">
                      #{i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={isFinal}
              onChange={(e) => setIsFinal(e.target.checked)}
              className="accent-brand-500 h-4 w-4"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Mark as Final</p>
              <p className="text-xs text-slate-400">Removes the DRAFT watermark from the document</p>
            </div>
          </label>

          {exports.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                Previous exports
              </p>
              <div className="space-y-1">
                {exports.slice(0, 3).map((ex: AccomplishmentExport) => (
                  <div key={ex.id} className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {new Date(ex.created_at).toLocaleString('en-PH', {
                        dateStyle: 'short', timeStyle: 'short',
                      })}
                      {ex.profiles && (
                        <span className="text-slate-400">
                          {' '}by {ex.profiles.first_name} {ex.profiles.last_name}
                        </span>
                      )}
                    </span>
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                        ex.is_final
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {ex.is_final ? 'Final' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-between pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={compileWord.isPending}
                onClick={handleExportWord}
                title="Download as Word document (.docx)"
              >
                <Download className="h-4 w-4" />
                Word
              </Button>
              <Button
                size="sm"
                loading={compile.isPending}
                onClick={handleExportPDF}
                title="Download as PDF"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
