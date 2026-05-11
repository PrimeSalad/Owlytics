import { CalendarDays, CheckCircle2, Clock, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody, StatusBadge, PageSpinner } from '@/components/ui';

import { StatCard } from './StatCard';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

export function OfficerDashboard() {
  const { user } = useAuthStore();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (isLoading) return <PageSpinner />;

  const myEvents = events.filter((e) =>
    e.assignedOfficers.some((o) => o._id === user?._id)
  );

  const allActivities = myEvents.flatMap((e) => e.activities);
  const done = allActivities.filter((a) => a.status === 'Done').length;
  const active = myEvents.filter((e) => e.status === 'Ongoing').length;

  return (
    <PageWrapper title="My Events" description="Manage your assigned events and activities">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My Events"       value={myEvents.length}      icon={CalendarDays} accent="brand"   />
        <StatCard label="Active"          value={active}               icon={Clock}        accent="warning" />
        <StatCard label="Activities Done" value={done}                 icon={CheckCircle2} accent="success" />
        <StatCard label="Total Activities" value={allActivities.length} icon={Activity}    accent="brand"   />
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-slate-700">Assigned Events</h3>
        {myEvents.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center text-slate-400 text-sm">
              No events assigned to you yet.
            </CardBody>
          </Card>
        ) : (
          myEvents.map((ev) => {
            const total = ev.activities.length;
            const doneCount = ev.activities.filter((a) => a.status === 'Done').length;
            return (
              <Card key={ev._id} hover>
                <CardBody className="flex items-center justify-between gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">{ev.title}</p>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(ev.dateRange.start).toLocaleDateString()} — {new Date(ev.dateRange.end).toLocaleDateString()}
                      {ev.venue && ` · ${ev.venue}`}
                    </p>
                    {total > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all"
                            style={{ width: `${(doneCount / total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{doneCount}/{total} activities</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </PageWrapper>
  );
}
