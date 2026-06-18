import { useState, useEffect } from 'react';
import { GripVertical, Download, CheckCircle2, FileText, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, Spinner } from '@/components/ui';
import { useCompileReportWord, useEvents } from './useReports';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { roleSatisfies, resolveRole } from '@/lib/utils';
import type { Event, Report } from '@/types';

interface Props { open: boolean; onClose: () => void }

const STEPS = ['Signatories', 'Select Events', 'Review Reports', 'Export'];

export function CompileReportModal({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? '';

  // Guard — only President/Secretary (and their aliases Adviser/VicePresident)
  if (!roleSatisfies(role, ['President', 'Secretary'])) return null;

  const fullName = user ? `${user.name?.first ?? ''} ${user.name?.last ?? ''}`.trim() : '';

  const [step, setStep]                   = useState(0);
  const [presidentName, setPresidentName] = useState('');
  const [secretaryName, setSecretaryName] = useState('');
  const [orgName, setOrgName]             = useState('STUDENT ORGANIZATION');
  const [preparedBy, setPreparedBy]       = useState('');
  const [academicYear, setAcademicYear]   = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [sections, setSections]           = useState<string[]>([]);
  const [isFinal, setIsFinal]             = useState(false);
  const [dragging, setDragging]           = useState<number | null>(null);

  // Pre-fill names based on role
  useEffect(() => {
    if (fullName) {
      setPreparedBy(fullName.toUpperCase());
      if (resolveRole(role) === 'President') {
        setPresidentName(fullName.toUpperCase());
      }
      if (resolveRole(role) === 'Secretary') {
        setSecretaryName(fullName.toUpperCase());
      }
    }
  }, [role, fullName]);

  // Pre-fill academic year from current date
  useEffect(() => {
    if (!academicYear) {
      setAcademicYear('2026 – 2027');
    }
  }, []);


  const { data: events = [] }  = useEvents();
  const compileWord = useCompileReportWord();

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['reports', { eventIds: selectedEventIds, status: 'Approved', type: 'Accomplishment' }],
    queryFn: () =>
      api.get<Report[]>('/reports', {
        params: {
          eventId: selectedEventIds,
          status: 'Approved',
          type: 'Accomplishment'
        }
      }).then((r) => r.data),
    enabled: selectedEventIds.length > 0,
  });

  const selectedEvents = events.filter((e: Event) => selectedEventIds.includes(e._id));

  // Build a map of activityId → activity name from all selected events
  const activityNameMap = new Map<string, string>();
  for (const event of selectedEvents) {
    if (event.activities) {
      for (const a of event.activities as any[]) {
        activityNameMap.set(a.id ?? a._id, a.name);
      }
    }
  }

  function getSectionLabel(actId: string): string {
    if (actId === '__general__') return 'General Reports';
    return activityNameMap.get(actId) ?? 'Unknown Activity';
  }

  function handleClose() {
    setStep(0); setSelectedEventIds([]); setSections([]); setIsFinal(false);
    onClose();
  }

  function handleEventToggle(id: string) {
    setSelectedEventIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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

  async function handleExportWord() {
    if (!presidentName.trim() || !academicYear.trim() || !secretaryName.trim()) {
      toast.error('Please fill in all required fields first.');
      setStep(0);
      return;
    }
    try {
      await compileWord.mutateAsync({
        eventIds: selectedEventIds,
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
      {/* Step indicator - more compact */}
      <div className="flex items-center gap-1.5 mb-4">
        {STEPS.map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <button
              onClick={() => { if (i < step) setStep(i); }}
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
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
              <div className={`h-0.5 w-4 transition-colors ${step > i ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">{STEPS[step]}</span>
      </div>

      {/* ── Step 0: Pre-fill details ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-brand-500" />
              Organization Details
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              These details will appear on the report's cover page and header.
            </p>
          </div>

          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
              />
            </div>

            <div className="col-span-6 pt-1">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-brand-500" />
                Signatories
              </h4>
            </div>

            <div className="col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">
                President <span className="text-red-500">*</span>
              </label>
              <input
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
              />
            </div>
            <div className="col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">
                Secretary <span className="text-red-500">*</span>
              </label>
              <input
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
              />
            </div>
            <div className="col-span-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">
                Prepared By
              </label>
              <input
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold opacity-80"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button size="sm" onClick={() => setStep(1)} disabled={!canProceedStep0} className="px-6">
              Next: Select Events →
            </Button>
          </div>
        </div>
      )}


      {/* ── Step 1: Select events ── */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-slate-500 px-1">Select events to include in the report:</p>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {events.length === 0 && (
              <div className="col-span-2 py-8 text-center text-xs text-slate-400 italic">No events found.</div>
            )}
            {events.map((e: Event) => {
              const isSelected = selectedEventIds.includes(e._id);
              return (
                <button
                  key={e._id}
                  onClick={() => handleEventToggle(e._id)}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-all flex items-center gap-2.5 ${
                    isSelected 
                      ? 'border-brand-500 bg-brand-50' 
                      : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-[11px] truncate ${isSelected ? 'text-brand-700' : 'text-slate-700'}`}>{e.title}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {new Date(e.dateRange?.start ?? '').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="pt-3 flex justify-between items-center border-t border-slate-100">
            <Button variant="secondary" size="xs" onClick={() => setStep(0)}>← Back</Button>
            <Button size="xs" onClick={() => setStep(2)} disabled={selectedEventIds.length === 0} className="font-bold">
              Review {selectedEventIds.length} Event{selectedEventIds.length !== 1 ? 's' : ''} →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Review reports ── */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-bold text-brand-800 text-[11px] truncate">
                {selectedEvents.length === 1 ? selectedEvents[0].title : `${selectedEvents.length} Events Selected`}
              </p>
              <p className="text-[9px] text-brand-600 font-medium">
                {reports.length} approved accomplishment report{reports.length !== 1 ? 's' : ''} found
              </p>
            </div>
            {loadingReports && <Spinner size="xs" />}
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {reports.length === 0 && !loadingReports && (
              <div className="py-6 text-center text-xs text-slate-400 italic">No approved reports found.</div>
            )}
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-100">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-700 truncate">{r.title}</p>
                  <p className="text-[9px] text-slate-400">
                    {selectedEvents.length > 1 && (
                      <span className="text-brand-500 font-medium">{selectedEvents.find(e => e._id === r.event_id)?.title} · </span>
                    )}
                    {r.report_attachments?.length ?? 0} photos
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-between pt-3 border-t border-slate-100">
            <Button variant="secondary" size="xs" onClick={() => setStep(1)}>← Back</Button>
            <Button size="xs" onClick={initSections} disabled={reports.length === 0 || loadingReports} className="font-bold">
              Finalize Layout →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Arrange + export ── */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] space-y-1">
              <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase">President</span> <span className="font-bold text-slate-700">{presidentName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase">Period</span> <span className="font-bold text-slate-700">{academicYear}</span></div>
            </div>
            <div className="w-40 flex flex-col justify-center gap-1.5 px-3 border border-slate-200 rounded-lg bg-white">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} className="accent-brand-500 h-3.5 w-3.5" />
                <span className="text-[10px] font-bold text-slate-700">Mark as Final</span>
              </label>
              <p className="text-[8px] text-slate-400 leading-none">Removes the DRAFT watermark</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Order of Sections</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sections.map((actId, i) => {
                const sectionReports = reports.filter((r) => (r.activity_id ?? '__general__') === actId);
                const firstReport = sectionReports[0];
                const eventTitle = firstReport ? selectedEvents.find(e => e._id === firstReport.event_id)?.title : null;
                return (
                  <div
                    key={actId} draggable onDragStart={() => onDragStart(i)} onDragOver={(e) => onDragOver(e, i)} onDragEnd={onDragEnd}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-white transition-all select-none ${
                      dragging === i ? 'border-brand-400 bg-brand-50 shadow-sm scale-[1.01]' : 'border-slate-200'
                    }`}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{getSectionLabel(actId)}</p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {selectedEvents.length > 1 && eventTitle && <span className="text-brand-500 font-medium">{eventTitle} · </span>}
                        {sectionReports.length} reports
                      </p>
                    </div>
                    <span className="text-[9px] font-black text-slate-200">#{(i+1).toString().padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-between pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setStep(2)}>← Back</Button>
            <Button size="sm" loading={compileWord.isPending} onClick={handleExportWord} className="font-bold px-8 shadow-sm">
              <Download className="h-4 w-4" /> Download DOCX
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
