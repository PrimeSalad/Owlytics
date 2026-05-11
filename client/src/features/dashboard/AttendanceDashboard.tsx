import { QrCode, Users, CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '@/components/layout';
import { Card, CardHeader, CardBody, CardTitle, Button, PageSpinner } from '@/components/ui';
import { StatCard } from './StatCard';
import { api } from '@/lib/api';
import type { Event } from '@/types';

export function AttendanceDashboard() {
  const navigate = useNavigate();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (isLoading) return <PageSpinner />;

  const activeEvent = events.find((e) => e.status === 'Ongoing');

  return (
    <PageWrapper title="Scanner Dashboard" description="Active session monitoring and QR scanning">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Events" value={events.filter((e) => e.status === 'Ongoing').length}  icon={Clock}        accent="warning" />
        <StatCard label="Total Events"  value={events.length}                                         icon={Users}        accent="brand"   />
        <StatCard label="Completed"     value={events.filter((e) => e.status === 'Completed').length} icon={CheckCircle2} accent="success" />
        <StatCard label="Planning"      value={events.filter((e) => e.status === 'Planning').length}  icon={Clock}        accent="brand"   />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Active Session</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            {activeEvent ? (
              <div className="rounded-lg bg-surface-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Event</span>
                  <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{activeEvent.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Venue</span>
                  <span className="font-medium text-slate-800">{activeEvent.venue || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Start</span>
                  <span className="font-medium text-slate-800">{new Date(activeEvent.dateRange.start).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">End</span>
                  <span className="font-medium text-slate-800">{new Date(activeEvent.dateRange.end).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No active event right now.</p>
            )}
            <Button className="w-full" size="lg" onClick={() => navigate('/scanner')}>
              <QrCode className="h-4 w-4" />
              Open Scanner
            </Button>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>All Events</CardTitle></CardHeader>
          <CardBody>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No events yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-xs text-slate-400 text-left">
                    <th className="pb-2 font-medium">Event</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {events.map((e) => (
                    <tr key={e._id}>
                      <td className="py-2.5 font-medium text-slate-800">{e.title}</td>
                      <td className="py-2.5 text-xs text-slate-400">
                        {new Date(e.dateRange.start).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          e.status === 'Ongoing' ? 'bg-warning-light text-warning-dark' :
                          e.status === 'Completed' ? 'bg-success-light text-success-dark' :
                          e.status === 'Cancelled' ? 'bg-danger-light text-danger-dark' :
                          'bg-info-light text-info-dark'
                        }`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
