import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, ChevronDown, LayoutGrid, MapPin, TimerOff, CalendarClock } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { QRScanner } from '@/components/qr/QRScanner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

type RawAttendanceSession = {
  id: string;
  label: string;
  open_at?: string;
  openAt?: string;
  close_at?: string;
  closeAt?: string;
  grace_period_minutes?: number;
};

type RawAttendanceSchedule = {
  id: string;
  label: string;
  attendance_sessions?: RawAttendanceSession[] | null;
};

type WindowStatus = 'open' | 'upcoming' | 'closed' | 'unscheduled';

const sessionOpen = (s?: { open_at?: string; openAt?: string }) => s?.open_at ?? s?.openAt;
const sessionClose = (s?: { close_at?: string; closeAt?: string }) => s?.close_at ?? s?.closeAt;

function windowStatus(open: string | undefined, close: string | undefined, now: number): WindowStatus {
  if (!open && !close) return 'unscheduled';
  const o = open ? new Date(open).getTime() : -Infinity;
  const c = close ? new Date(close).getTime() : Infinity;
  if (now < o) return 'upcoming';
  if (now > c) return 'closed';
  return 'open';
}

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const STATUS_BADGE: Record<WindowStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  open:        { label: 'Open now', variant: 'success' },
  upcoming:    { label: 'Upcoming', variant: 'warning' },
  closed:      { label: 'Closed', variant: 'danger' },
  unscheduled: { label: 'No time set', variant: 'default' },
};

export function ScannerPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [now, setNow] = useState<number>(() => Date.now());

  // Tick so Open/Upcoming/Closed status stays accurate while the page is open.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  // 1. Fetch Events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  // 2. Fetch Schedules for selected event
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => (await api.get<RawAttendanceSchedule[]>(`/attendance/schedules/${selectedEventId}`)).data,
  });

  const selectedEvent = events.find(e => e._id === selectedEventId);
  
  const allSessions = useMemo(() => {
    return schedules.flatMap(s => 
      (s.attendance_sessions || []).map(sess => ({
        ...sess,
        scheduleId: s.id,
        scheduleLabel: s.label
      }))
    );
  }, [schedules]);

  const selectedSession = allSessions.find(s => s.id === selectedSessionId);
  const selectedStatus = windowStatus(sessionOpen(selectedSession), sessionClose(selectedSession), now);
  const canScan = selectedStatus === 'open' || selectedStatus === 'unscheduled';

  return (
    <PageWrapper title="QR Scanner" description="Scan student QR codes for the active session.">
      <div className="space-y-6">
        {/* Assigned section banner */}
        {user?.role === 'Attendance' && (
          <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100">
              <MapPin className="h-4 w-4 text-brand-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Your Assigned Section</p>
              <p className="truncate text-sm font-bold text-brand-900">
                {user.assignedSection || 'No section assigned — contact your administrator'}
              </p>
            </div>
            <Badge variant="primary" className="ml-auto hidden sm:inline-flex">Scoped Scanning</Badge>
          </div>
        )}

        {/* Selection Area */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Event Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Event
            </label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setSelectedSessionId('');
                }}
                disabled={eventsLoading}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Choose an event...</option>
                {events.map((e) => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Session Select */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Attendance Session
            </label>
            <div className="relative">
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={!selectedEventId || schedulesLoading}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {!selectedEventId ? (
                  <option value="">Select an event first</option>
                ) : schedulesLoading ? (
                  <option value="">Loading sessions...</option>
                ) : allSessions.length === 0 ? (
                  <option value="">No sessions found for this event</option>
                ) : (
                  <>
                    <option value="">Choose a session...</option>
                    {allSessions.map((s) => {
                      const st = windowStatus(sessionOpen(s), sessionClose(s), now);
                      const open = sessionOpen(s);
                      const time = open ? ` · ${fmtTime(open)}` : '';
                      return (
                        <option key={s.id} value={s.id}>
                          {s.scheduleLabel} — {s.label}{time} ({STATUS_BADGE[st].label})
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Scanner Area */}
        {!selectedSessionId ? (
          <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
            <CardBody className="flex flex-col items-center justify-center py-24 gap-5 text-slate-400">
              <div className="h-20 w-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                <LayoutGrid className="h-10 w-10 text-slate-300" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-display text-lg font-bold text-slate-800 tracking-tight">Ready to Scan</h3>
                <p className="text-sm font-medium text-slate-500 max-w-xs">
                  Please select an event and attendance session from the dropdowns above to start scanning.
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedEvent?.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info">{selectedSession?.scheduleLabel}</Badge>
                    <Badge variant="primary">{selectedSession?.label}</Badge>
                    <Badge variant={STATUS_BADGE[selectedStatus].variant}>{STATUS_BADGE[selectedStatus].label}</Badge>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setSelectedSessionId('')}>
                  Change Session
                </Button>
              </div>

              {canScan ? (
                <QRScanner
                  key={selectedSessionId}
                  eventId={selectedEventId}
                  scheduleId={selectedSession?.scheduleId || ''}
                  sessionId={selectedSessionId}
                />
              ) : (
                <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
                  <CardBody className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200">
                      {selectedStatus === 'upcoming'
                        ? <CalendarClock className="h-8 w-8 text-warning-500" />
                        : <TimerOff className="h-8 w-8 text-danger-500" />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-bold text-slate-800">
                        {selectedStatus === 'upcoming' ? 'Scanning hasn’t started yet' : 'This session has closed'}
                      </h3>
                      <p className="max-w-sm text-sm font-medium text-slate-500">
                        {selectedStatus === 'upcoming'
                          ? `Scanning for this session opens ${fmtTime(sessionOpen(selectedSession))}.`
                          : `This session closed ${fmtTime(sessionClose(selectedSession))}. Ask the Secretary or President to reopen it if needed.`}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>

            <div className="hidden lg:block space-y-4">
              <Card>
                <CardBody className="p-4 space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Scanner Info</h3>
                  <div className="space-y-3">
                    <InfoItem label="Event" value={selectedEvent?.title || ''} />
                    <InfoItem label="Schedule" value={selectedSession?.scheduleLabel || ''} />
                    <InfoItem label="Session" value={selectedSession?.label || ''} />
                    <InfoItem label="Opens" value={fmtTime(sessionOpen(selectedSession))} />
                    <InfoItem label="Closes" value={fmtTime(sessionClose(selectedSession))} />
                    <InfoItem label="Status" value={STATUS_BADGE[selectedStatus].label} />
                  </div>
                </CardBody>
              </Card>
              
              <div className="rounded-xl bg-brand-50 p-4 border border-brand-100">
                <h4 className="text-sm font-bold text-brand-800">Quick Tip</h4>
                <p className="text-xs text-brand-700 mt-1 leading-relaxed">
                  You can use an external USB QR scanner or your device camera. Both will record attendance instantly to the server.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
    </div>
  );
}
