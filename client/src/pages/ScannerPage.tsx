import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, Calendar, Clock, ChevronDown, LayoutGrid } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody, Button, Spinner, Badge } from '@/components/ui';
import { QRScanner } from '@/components/qr/QRScanner';
import { api } from '@/lib/api';
import type { Event } from '@/types';

type RawAttendanceSession = {
  id: string;
  label: string;
  open_at?: string;
  openAt?: string;
};

type RawAttendanceSchedule = {
  id: string;
  label: string;
  attendance_sessions?: RawAttendanceSession[] | null;
};

export function ScannerPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

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

  return (
    <PageWrapper title="QR Scanner" description="Scan student QR codes for the active session.">
      <div className="space-y-6">
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
                  setSelectedScheduleId('');
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
                    {allSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.scheduleLabel} — {s.label}
                      </option>
                    ))}
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
                    <Badge variant="brand">{selectedSession?.label}</Badge>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setSelectedSessionId('')}>
                  Change Session
                </Button>
              </div>
              
              <QRScanner 
                eventId={selectedEventId} 
                scheduleId={selectedSession?.scheduleId || ''}
                sessionId={selectedSessionId} 
              />
            </div>

            <div className="hidden lg:block space-y-4">
              <Card>
                <CardBody className="p-4 space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Scanner Info</h3>
                  <div className="space-y-3">
                    <InfoItem label="Mode" value="Real-time Sync" />
                    <InfoItem label="Event" value={selectedEvent?.title || ''} />
                    <InfoItem label="Schedule" value={selectedSession?.scheduleLabel || ''} />
                    <InfoItem label="Session" value={selectedSession?.label || ''} />
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
