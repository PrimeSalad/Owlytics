import { CalendarDays, TrendingUp, AlertTriangle, Users } from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Card, CardHeader, CardBody, CardTitle, StatusBadge, PageSpinner } from '@/components/ui';
import { StatCard } from './StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '@/lib/api';
import type { Event, Report } from '@/types';

export function PresidentDashboard() {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'Emergency'],
    queryFn: async () => (await api.get<Report[]>('/reports?type=Emergency')).data,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<{ length: number }[]>('/users')).data,
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/reports/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report resolved');
    },
  });

  if (eventsLoading || reportsLoading) return <PageSpinner />;

  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === 'Ongoing').length;
  const allActivities = events.flatMap((e) => e.activities);
  const done = allActivities.filter((a) => a.status === 'Done').length;
  const inProgress = allActivities.filter((a) => a.status === 'InProgress').length;
  const pending = allActivities.filter((a) => a.status === 'Pending').length;
  const unresolvedEmergencies = reports.filter((r) => !r.isResolved);

  const taskData = [
    { name: 'Done',        value: done,       color: '#10b981' },
    { name: 'In Progress', value: inProgress,  color: '#f59e0b' },
    { name: 'Pending',     value: pending,     color: '#e2e8f0' },
  ].filter((d) => d.value > 0);

  // Attendance trend per event (from completed events)
  const trendData = events
    .filter((e) => e.status === 'Completed')
    .slice(-6)
    .map((e) => ({ event: e.title.slice(0, 12), activities: e.activities.length }));

  return (
    <PageWrapper title="Overview" description="Organization-wide summary">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Events"   value={totalEvents}  icon={CalendarDays} accent="brand"   />
        <StatCard label="Active Events"  value={activeEvents} icon={TrendingUp}   accent="warning" />
        <StatCard label="Members"        value={users.length} icon={Users}        accent="success" />
        <StatCard label="Emergencies"    value={unresolvedEmergencies.length} icon={AlertTriangle} accent={unresolvedEmergencies.length > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Events timeline */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Completed Events — Activity Count</CardTitle></CardHeader>
          <CardBody>
            {trendData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No completed events yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="event" tick={{ fontSize: 11, fontFamily: 'Poppins' }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="activities" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Activity status donut */}
        <Card>
          <CardHeader><CardTitle>Activity Status</CardTitle></CardHeader>
          <CardBody>
            {allActivities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No activities yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={taskData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {taskData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: 'Poppins' }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Emergency feed */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Emergency Reports</CardTitle>
          {unresolvedEmergencies.length > 0 && <StatusBadge status="Emergency" />}
        </CardHeader>
        <CardBody>
          {unresolvedEmergencies.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No active emergencies.</p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {unresolvedEmergencies.map((r) => (
                <li key={r._id} className="flex items-start justify-between gap-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.title}</p>
                      <p className="text-xs text-slate-400">
                        {r.authorId.name.first} {r.authorId.name.last} · {new Date(r.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => resolveMutation.mutate(r._id)}
                    className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                  >
                    Resolve
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
