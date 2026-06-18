import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Calendar, ChevronDown, Clock, Plus, Search, Users, X, FileText, Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Badge, Button, Card, CardBody, Input, Modal, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { cn, roleSatisfies } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

const SESSION_LABELS = ['AM In', 'AM Out', 'PM In', 'PM Out'] as const;

type SessionLabel = (typeof SESSION_LABELS)[number];
type AttendanceStatus = 'Present' | 'Late' | 'Absent';

type RawAttendanceSession = {
  id: string;
  label: SessionLabel;
  open_at?: string;
  openAt?: string;
  close_at?: string;
  closeAt?: string;
  grace_period_minutes?: number;
  gracePeriodMinutes?: number;
};

type RawAttendanceSchedule = {
  id: string;
  label: string;
  attendance_sessions?: RawAttendanceSession[] | null;
};

type RawAttendanceRecord = {
  id?: string;
  _id?: string;
  schedule_id?: string;
  scheduleId?: string;
  session_id?: string;
  sessionId?: string;
  studentId?: {
    _id?: string;
    studentId?: string;
    name?: { first?: string; last?: string };
  };
  students?: {
    id?: string;
    student_id?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  status?: string;
  scannedBy?: {
    name?: { first?: string; last?: string };
  } | null;
  profiles?: {
    first_name?: string;
    last_name?: string;
  } | null;
  timestamp?: string;
};

type DisplaySession = {
  id: string;
  scheduleId: string;
  scheduleLabel: string;
  label: SessionLabel;
  openAt: string;
  closeAt: string;
  gracePeriodMinutes: number;
};

type DisplayRecord = {
  id: string;
  scheduleId: string;
  sessionId: string;
  sessionLabel: string;
  scheduleLabel: string;
  studentName: string;
  studentCode: string;
  initials: string;
  status: AttendanceStatus;
  timestamp: string;
  scannedBy: string;
};

type MetricTone = 'slate' | 'success' | 'warning' | 'danger' | 'brand';

const scheduleSchema = z.object({
  eventId: z.string().min(1, 'Choose an event'),
  label: z.string().min(1, 'Enter a schedule name'),
  sessions: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.enum(SESSION_LABELS),
        openAt: z.string().min(1, 'Set an opening time'),
        closeAt: z.string().min(1, 'Set a closing time'),
        gracePeriodMinutes: z.coerce.number().int().min(0, 'Use 0 or higher').default(15),
      })
    )
    .min(1, 'Add at least one session'),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export function AttendancePage() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canManageSchedules = roleSatisfies(role, ['President', 'Secretary']);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<RawAttendanceSchedule | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // Keep "Open / Soon / Closed" session statuses accurate while the page is open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  useEffect(() => {
    if (selectedEventId || events.length === 0) return;
    const preferredEvent = events.find((event) => event.status === 'Ongoing') ?? events[0];
    setSelectedEventId(preferredEvent._id);
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((event) => event._id === selectedEventId),
    [events, selectedEventId]
  );

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', selectedEventId],
    enabled: Boolean(selectedEventId),
    queryFn: async () =>
      (await api.get<RawAttendanceSchedule[]>(`/attendance/schedules/${selectedEventId}`)).data,
  });

  const { data: rawRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['records', selectedEventId],
    enabled: Boolean(selectedEventId),
    queryFn: async () =>
      (await api.get<RawAttendanceRecord[]>(`/attendance/records/${selectedEventId}`)).data,
  });

  const sessions = useMemo<DisplaySession[]>(() => {
    return schedules
      .flatMap((schedule) =>
        (schedule.attendance_sessions ?? []).map((session) => ({
          id: session.id,
          scheduleId: schedule.id,
          scheduleLabel: schedule.label,
          label: session.label,
          openAt: session.open_at ?? session.openAt ?? '',
          closeAt: session.close_at ?? session.closeAt ?? '',
          gracePeriodMinutes: session.grace_period_minutes ?? session.gracePeriodMinutes ?? 0,
        }))
      )
      .sort((a, b) => dateValue(a.openAt) - dateValue(b.openAt));
  }, [schedules]);

  useEffect(() => {
    if (selectedSessionId === 'all') return;
    if (!sessions.some((session) => session.id === selectedSessionId)) {
      setSelectedSessionId('all');
    }
  }, [selectedSessionId, sessions]);

  const sessionMap = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions]
  );

  const sessionsBySchedule = useMemo(() => {
    const map = new Map<string, DisplaySession[]>();
    sessions.forEach((session) => {
      map.set(session.scheduleId, [...(map.get(session.scheduleId) ?? []), session]);
    });
    return map;
  }, [sessions]);

  const records = useMemo(
    () => rawRecords.map((record) => normalizeRecord(record, sessionMap)),
    [rawRecords, sessionMap]
  );

  const recordCountsBySession = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((record) => {
      counts.set(record.sessionId, (counts.get(record.sessionId) ?? 0) + 1);
    });
    return counts;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const scopedRecords =
      selectedSessionId === 'all'
        ? records
        : records.filter((record) => record.sessionId === selectedSessionId);

    const query = searchQuery.trim().toLowerCase();
    if (!query) return scopedRecords;

    return scopedRecords.filter((record) =>
      [
        record.studentName,
        record.studentCode,
        record.sessionLabel,
        record.scheduleLabel,
        record.scannedBy,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [records, searchQuery, selectedSessionId]);

  const stats = useMemo(() => {
    const targetRecords =
      selectedSessionId === 'all'
        ? records
        : records.filter((record) => record.sessionId === selectedSessionId);

    const present = targetRecords.filter((record) => record.status === 'Present').length;
    const late = targetRecords.filter((record) => record.status === 'Late').length;
    const absent = targetRecords.filter((record) => record.status === 'Absent').length;
    const checkedIn = present + late;

    return {
      absent,
      checkedIn,
      late,
      present,
      rate: targetRecords.length ? Math.round((checkedIn / targetRecords.length) * 100) : 0,
      total: targetRecords.length,
    };
  }, [records, selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId),
    [selectedSessionId, sessions]
  );

  const hasFilters = selectedSessionId !== 'all' || searchQuery.trim().length > 0;
  const pageDescription = selectedEvent
    ? `${selectedEvent.title} - ${formatDateRange(selectedEvent)}`
    : 'Choose an activity to view sessions and scan logs.';

  function handleEventChange(eventId: string) {
    setSelectedEventId(eventId);
    setSelectedSessionId('all');
    setSearchQuery('');
  }

  function clearFilters() {
    setSelectedSessionId('all');
    setSearchQuery('');
  }

  return (
    <PageWrapper
      title="Attendance"
      description={pageDescription}
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
            <label htmlFor="attendance-event" className="sr-only">
              Select activity
            </label>
            <select
              id="attendance-event"
              value={selectedEventId}
              disabled={eventsLoading || events.length === 0}
              onChange={(event) => handleEventChange(event.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm font-semibold text-slate-800 shadow-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <option value="">Select activity</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {canManageSchedules && (
            <Button disabled={events.length === 0} onClick={() => setScheduleOpen(true)}>
              <Plus className="h-4 w-4" />
              New schedule
            </Button>
          )}

          <Link to="/attendance/summary">
            <Button variant="secondary">
              <FileText className="h-4 w-4" />
              View summary
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {!selectedEventId ? (
          <EmptyPanel
            icon={eventsLoading ? Clock : Calendar}
            title={eventsLoading ? 'Loading events' : 'No event selected'}
            description={
              events.length === 0 && !eventsLoading
                ? 'Create an event before adding schedules.'
                : 'Choose an event to view sessions and scan logs.'
            }
            loading={eventsLoading}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
            <aside className="space-y-4 xl:sticky xl:top-4">
              <Card className="xl:min-h-[560px]">
                <CardBody className="flex flex-col gap-4 p-4 xl:min-h-[560px]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900">Sessions</h3>
                      <p className="text-xs text-slate-500">
                        {schedules.length} {schedules.length === 1 ? 'schedule' : 'schedules'}
                      </p>
                    </div>
                    {selectedEvent && (
                      <Badge variant={selectedEvent.status === 'Ongoing' ? 'warning' : 'default'}>
                        {selectedEvent.status}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSessionId('all')}
                      className={cn(
                        'flex min-h-14 w-full items-center justify-between rounded-xl border px-3 text-left transition-all',
                        selectedSessionId === 'all'
                          ? 'border-brand-200 bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <span>
                        <span className="block text-sm font-bold">All scan logs</span>
                        <span className="text-xs text-slate-500">{records.length} entries</span>
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                        {records.length}
                      </span>
                    </button>
                  </div>

                  {schedulesLoading ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl bg-slate-50 py-10">
                      <Spinner />
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                      <AlertTriangle className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-3 text-sm font-bold text-slate-800">No schedules yet</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Add scan windows before attendance starts.
                      </p>
                    </div>
                  ) : (
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                      {schedules.map((schedule) => (
                        <ScheduleGroup
                          key={schedule.id}
                          canManage={canManageSchedules}
                          onEdit={() => setEditSchedule(schedule)}
                          now={now}
                          onSelectSession={(sessionId) => setSelectedSessionId(sessionId)}
                          recordCountsBySession={recordCountsBySession}
                          schedule={schedule}
                          selectedSessionId={selectedSessionId}
                          sessions={sessionsBySchedule.get(schedule.id) ?? []}
                        />
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </aside>

            <section className="min-w-0 space-y-4">
              <section className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
                <SummaryStat
                  label="Checked in"
                  value={stats.checkedIn}
                  helper={`${stats.rate}% rate`}
                  tone="brand"
                />
                <SummaryStat
                  label="Present"
                  value={stats.present}
                  helper={`${stats.total} total`}
                  tone="success"
                />
                <SummaryStat label="Late" value={stats.late} helper="After grace" tone="warning" />
                <SummaryStat
                  label="Absent"
                  value={stats.absent}
                  helper="Marked missing"
                  tone="danger"
                />
              </section>

              <Card className="min-h-[432px]">
                <CardBody className="p-0">
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-bold text-slate-900">
                            {selectedSession ? selectedSession.label : 'Scan logs'}
                          </h3>
                          {selectedSession && (() => {
                            const meta = SESSION_STATUS[windowStatus(selectedSession.openAt, selectedSession.closeAt, now)];
                            return (
                              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', meta.chip)}>
                                {meta.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedSession
                            ? `${selectedSession.scheduleLabel} · ${formatSessionWindow(selectedSession)}`
                            : `${records.length} ${records.length === 1 ? 'entry' : 'entries'}`}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row lg:min-w-[380px] lg:justify-end">
                        <div className="relative w-full sm:max-w-xs">
                          <label htmlFor="attendance-search" className="sr-only">
                            Search logs
                          </label>
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="attendance-search"
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search student or ID"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              aria-label="Clear search"
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {hasFilters && (
                          <Button
                            className="h-10 shrink-0"
                            variant="secondary"
                            onClick={clearFilters}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {recordsLoading ? (
                    <div className="flex justify-center py-24">
                      <Spinner size="lg" />
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <EmptyTableState hasFilters={hasFilters} onClear={clearFilters} />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                            <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Student
                            </th>
                            <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Session
                            </th>
                            <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Status
                            </th>
                            <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Time
                            </th>
                            <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Checked by
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRecords.map((record) => (
                            <tr key={record.id} className="transition-colors hover:bg-slate-50/80">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-xs font-bold text-brand-700">
                                    {record.initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-900">
                                      {record.studentName}
                                    </p>
                                    <p className="font-mono text-[11px] text-slate-500">
                                      {record.studentCode}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-700">
                                    {record.sessionLabel}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {record.scheduleLabel}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <StatusBadge status={record.status} />
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">
                                    {formatTime(record.timestamp)}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {formatShortDate(record.timestamp)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className="font-medium text-slate-600">
                                  {record.scannedBy}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </section>
          </div>
        )}
      </div>

      <ScheduleFormModal
        defaultEventId={selectedEventId}
        events={events}
        schedule={editSchedule}
        open={scheduleOpen || Boolean(editSchedule)}
        onClose={() => {
          setScheduleOpen(false);
          setEditSchedule(null);
        }}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['schedules', selectedEventId] });
          setScheduleOpen(false);
          setEditSchedule(null);
        }}
      />
    </PageWrapper>
  );
}

function SummaryStat({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone: MetricTone;
}) {
  const toneClass: Record<MetricTone, string> = {
    slate: 'text-slate-700',
    success: 'text-success-700',
    warning: 'text-warning-700',
    danger: 'text-danger-700',
    brand: 'text-brand-700',
  };

  return (
    <Card className="h-full">
      <CardBody className="flex h-full min-h-[112px] flex-col justify-between p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <div>
          <p className={cn('font-display text-3xl font-bold leading-none', toneClass[tone])}>
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function ScheduleGroup({
  canManage,
  now,
  onEdit,
  onSelectSession,
  recordCountsBySession,
  schedule,
  selectedSessionId,
  sessions,
}: {
  canManage: boolean;
  now: number;
  onEdit: () => void;
  onSelectSession: (sessionId: string) => void;
  recordCountsBySession: Map<string, number>;
  schedule: RawAttendanceSchedule;
  selectedSessionId: string;
  sessions: DisplaySession[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-500">
          {schedule.label}
        </p>
        {canManage && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${schedule.label}`}
            title="Edit schedule & times"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {sessions.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            No sessions configured.
          </p>
        ) : (
          sessions.map((session) => {
            const status = windowStatus(session.openAt, session.closeAt, now);
            const meta = SESSION_STATUS[status];
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-all',
                  selectedSessionId === session.id
                    ? 'border-brand-200 bg-brand-50 text-brand-700'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white'
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', meta.dot)} title={meta.label} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{session.label}</span>
                      <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', meta.chip)}>
                        {meta.label}
                      </span>
                    </span>
                    <span className="block text-[11px] text-slate-500">{formatSessionWindow(session)}</span>
                  </span>
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                  {recordCountsBySession.get(session.id) ?? 0}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function EmptyPanel({
  description,
  icon: Icon,
  loading,
  title,
}: {
  description: string;
  icon: LucideIcon;
  loading?: boolean;
  title: string;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300">
        {loading ? <Spinner /> : <Icon className="h-8 w-8" />}
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

function EmptyTableState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300">
        <Users className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-bold text-slate-900">
        {hasFilters ? 'No matching logs' : 'No scan logs yet'}
      </p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasFilters
          ? 'Try another search or show all sessions.'
          : 'Logs appear here after students scan in.'}
      </p>
      {hasFilters && (
        <Button className="mt-4" variant="secondary" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

function ScheduleFormModal({
  defaultEventId,
  events,
  schedule,
  onClose,
  onSuccess,
  open,
}: {
  defaultEventId: string;
  events: Event[];
  schedule?: RawAttendanceSchedule | null;
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const isEdit = Boolean(schedule);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: getScheduleDefaults(defaultEventId),
  });

  const { append, fields, remove } = useFieldArray({ control, name: 'sessions' });

  useEffect(() => {
    if (!open) return;
    reset(schedule ? scheduleToForm(schedule, defaultEventId) : getScheduleDefaults(defaultEventId));
  }, [defaultEventId, open, reset, schedule]);

  const mutation = useMutation({
    mutationFn: (values: ScheduleForm) => {
      const payload = {
        eventId: values.eventId,
        label: values.label,
        sessions: values.sessions.map((session) => ({
          id: session.id,
          closeAt: session.closeAt,
          gracePeriodMinutes: session.gracePeriodMinutes,
          label: session.label,
          openAt: session.openAt,
        })),
      };
      return isEdit && schedule
        ? api.patch(`/attendance/schedules/${schedule.id}`, payload)
        : api.post('/attendance/schedules', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Schedule updated' : 'Schedule created');
      reset(getScheduleDefaults(defaultEventId));
      onSuccess();
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'error' in error.response.data &&
        typeof error.response.data.error === 'string'
          ? error.response.data.error
          : isEdit ? 'Failed to update schedule' : 'Failed to create schedule';
      toast.error(message);
    },
  });

  function closeModal() {
    reset(getScheduleDefaults(defaultEventId));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={isEdit ? 'Edit Schedule' : 'Create Schedule'}
      description="Set the event and time windows scanners will use."
      size="xl"
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="schedule-event"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Event <span className="text-danger">*</span>
            </label>
            <select
              id="schedule-event"
              {...register('eventId')}
              disabled={isEdit}
              className={cn(
                'h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
                errors.eventId ? 'border-danger-500' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <option value="">Choose event</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
            {errors.eventId && <p className="mt-1 text-xs text-danger">{errors.eventId.message}</p>}
          </div>

          <Input
            label="Schedule name"
            placeholder="Day 1 morning"
            required
            error={errors.label?.message}
            {...register('label')}
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sessions
              </h4>
              <p className="mt-1 text-sm text-slate-500">Add one row for each scan window.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                append({ closeAt: '', gracePeriodMinutes: 15, label: 'AM In', openAt: '' })
              }
            >
              <Plus className="h-4 w-4" />
              Add session
            </Button>
          </div>

          {errors.sessions?.root && (
            <p className="text-sm text-danger">{errors.sessions.root.message}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                      {index + 1}
                    </span>
                    <select
                      aria-label={`Session ${index + 1} label`}
                      {...register(`sessions.${index}.label`)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      {SESSION_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove session ${index + 1}`}
                      onClick={() => remove(index)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="Opens"
                    type="datetime-local"
                    required
                    error={errors.sessions?.[index]?.openAt?.message}
                    {...register(`sessions.${index}.openAt`)}
                  />
                  <Input
                    label="Closes"
                    type="datetime-local"
                    required
                    error={errors.sessions?.[index]?.closeAt?.message}
                    {...register(`sessions.${index}.closeAt`)}
                  />
                  <Input
                    label="Grace (min)"
                    min={0}
                    type="number"
                    error={errors.sessions?.[index]?.gracePeriodMinutes?.message}
                    {...register(`sessions.${index}.gracePeriodMinutes`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Save changes' : 'Create schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function getScheduleDefaults(defaultEventId: string): ScheduleForm {
  return {
    eventId: defaultEventId,
    label: '',
    sessions: [{ closeAt: '', gracePeriodMinutes: 15, label: 'AM In', openAt: '' }],
  };
}

/** Format an ISO timestamp into the `YYYY-MM-DDTHH:mm` shape <input type="datetime-local"> needs (local time). */
function toDateTimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Build form defaults from an existing schedule so its sessions/times can be edited. */
function scheduleToForm(schedule: RawAttendanceSchedule, defaultEventId: string): ScheduleForm {
  const sessions = (schedule.attendance_sessions ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    openAt: toDateTimeLocal(s.open_at ?? s.openAt),
    closeAt: toDateTimeLocal(s.close_at ?? s.closeAt),
    gracePeriodMinutes: s.grace_period_minutes ?? s.gracePeriodMinutes ?? 15,
  }));
  return {
    eventId: defaultEventId,
    label: schedule.label,
    sessions: sessions.length
      ? sessions
      : [{ closeAt: '', gracePeriodMinutes: 15, label: 'AM In', openAt: '' }],
  };
}

function normalizeRecord(
  record: RawAttendanceRecord,
  sessionMap: Map<string, DisplaySession>
): DisplayRecord {
  const sessionId = record.session_id ?? record.sessionId ?? '';
  const scheduleId = record.schedule_id ?? record.scheduleId ?? '';
  const session = sessionMap.get(sessionId);

  const firstName = record.studentId?.name?.first ?? record.students?.first_name ?? 'Unknown';
  const lastName = record.studentId?.name?.last ?? record.students?.last_name ?? 'Student';
  const studentName = `${firstName} ${lastName}`.trim();
  const studentCode = record.studentId?.studentId ?? record.students?.student_id ?? 'No ID';

  const scannerFirst = record.scannedBy?.name?.first ?? record.profiles?.first_name;
  const scannerLast = record.scannedBy?.name?.last ?? record.profiles?.last_name;
  const scannerName = [scannerFirst, scannerLast].filter(Boolean).join(' ').trim();

  return {
    id: record.id ?? record._id ?? `${studentCode}-${sessionId}-${record.timestamp ?? 'log'}`,
    initials: getInitials(firstName, lastName),
    scannedBy: scannerName || (record.status === 'Absent' ? 'Auto-marked' : 'System'),
    scheduleId,
    scheduleLabel: session?.scheduleLabel ?? 'Unmatched schedule',
    sessionId,
    sessionLabel: session?.label ?? 'Unmatched session',
    status: toAttendanceStatus(record.status),
    studentCode,
    studentName,
    timestamp: record.timestamp ?? '',
  };
}

function toAttendanceStatus(status: string | undefined): AttendanceStatus {
  if (status === 'Late' || status === 'Absent' || status === 'Present') return status;
  return 'Present';
}

function getInitials(firstName: string, lastName: string) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  return initials || 'ST';
}

function dateValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

type WindowStatus = 'open' | 'upcoming' | 'closed';

const SESSION_STATUS: Record<WindowStatus, { label: string; dot: string; chip: string }> = {
  open:     { label: 'Open',   dot: 'bg-success-500 animate-pulse', chip: 'bg-success-50 text-success-700' },
  upcoming: { label: 'Soon',   dot: 'bg-warning-500',               chip: 'bg-warning-50 text-warning-700' },
  closed:   { label: 'Closed', dot: 'bg-slate-300',                 chip: 'bg-slate-100 text-slate-500' },
};

function windowStatus(openAt: string, closeAt: string, now: number): WindowStatus {
  const open = dateValue(openAt);
  const close = dateValue(closeAt);
  if (open && now < open) return 'upcoming';
  if (close && now > close) return 'closed';
  return 'open';
}

function formatDateRange(event: Event) {
  const start = new Date(event.dateRange.start);
  const end = new Date(event.dateRange.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Date unavailable';

  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = start.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const endText = end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startText} - ${endText}`;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No time';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatSessionWindow(session: Pick<DisplaySession, 'closeAt' | 'openAt'>) {
  return `${formatTime(session.openAt)} - ${formatTime(session.closeAt)}`;
}
