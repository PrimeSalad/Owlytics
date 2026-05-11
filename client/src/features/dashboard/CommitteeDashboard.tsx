import { FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout';
import { Card, CardHeader, CardBody, CardTitle, Button, StatusBadge, PageSpinner } from '@/components/ui';
import { StatCard } from './StatCard';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

export function CommitteeDashboard() {
  const { user } = useAuthStore();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (isLoading) return <PageSpinner />;

  // Activities assigned to this committee member
  const myActivities = events.flatMap((e) =>
    e.activities
      .filter((a) => a.committeeId === user?._id)
      .map((a) => ({ ...a, eventTitle: e.title }))
  );

  const done = myActivities.filter((a) => a.status === 'Done').length;
  const inProgress = myActivities.filter((a) => a.status === 'InProgress').length;
  const updatesSent = myActivities.reduce((sum, a) => sum + a.updates.length, 0);

  return (
    <PageWrapper title="My Activities" description="Submit updates and manage your assigned activities">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned"     value={myActivities.length} icon={FileText}    accent="brand"   />
        <StatCard label="In Progress"  value={inProgress}          icon={Clock}       accent="warning" />
        <StatCard label="Completed"    value={done}                icon={CheckCircle2} accent="success" />
        <StatCard label="Updates Sent" value={updatesSent}         icon={FileText}    accent="brand"   />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-display text-sm font-semibold text-slate-700">My Activities</h3>
          {myActivities.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center text-slate-400 text-sm">
                No activities assigned to you yet.
              </CardBody>
            </Card>
          ) : (
            myActivities.map((act) => (
              <Card key={act._id}>
                <CardBody className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{act.name}</p>
                      <StatusBadge status={act.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {act.eventTitle} · {act.updates.length} updates
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">Submit Update</Button>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <Button variant="primary" className="w-full" size="md">
              <FileText className="h-4 w-4" />
              Submit Activity Update
            </Button>
            <Button variant="danger" className="w-full" size="md">
              <AlertTriangle className="h-4 w-4" />
              File Emergency Report
            </Button>
            <p className="text-xs text-slate-400 text-center pt-1">
              Emergency reports are sent immediately to the President and Officers.
            </p>
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
