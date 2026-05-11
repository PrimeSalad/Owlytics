import { GraduationCap, ClipboardList, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout';
import { Card, CardHeader, CardBody, CardTitle, PageSpinner } from '@/components/ui';
import { StatCard } from './StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import type { Event } from '@/types';

export function SecretaryDashboard() {
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<{ total: number; students: { yearLevel: number }[] }>('/students?limit=1000')).data,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  if (studentsLoading || eventsLoading) return <PageSpinner />;

  const total = studentsData?.total ?? 0;
  const students = studentsData?.students ?? [];
  const completedEvents = events.filter((e) => e.status === 'Completed').length;
  const upcomingEvents = events.filter((e) => e.status === 'Planning').length;

  // Year-level distribution
  const yearMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  students.forEach((s) => { if (s.yearLevel in yearMap) yearMap[s.yearLevel]++; });
  const yearData = [
    { year: '1st Year', count: yearMap[1] },
    { year: '2nd Year', count: yearMap[2] },
    { year: '3rd Year', count: yearMap[3] },
    { year: '4th Year', count: yearMap[4] },
  ];

  return (
    <PageWrapper title="Records Overview" description="Student database and attendance management">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Students"    value={total}           icon={GraduationCap} accent="brand"   />
        <StatCard label="Total Events"      value={events.length}   icon={CalendarDays}  accent="brand"   />
        <StatCard label="Upcoming Events"   value={upcomingEvents}  icon={ClipboardList} accent="warning" />
        <StatCard label="Completed Events"  value={completedEvents} icon={CheckCircle2}  accent="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Students by Year Level</CardTitle></CardHeader>
          <CardBody>
            {total === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No students imported yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'Poppins' }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Events</CardTitle></CardHeader>
          <CardBody>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No events created yet.</p>
            ) : (
              <ul className="divide-y divide-surface-border">
                {events.slice(0, 5).map((e) => (
                  <li key={e._id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{e.title}</p>
                      <p className="text-xs text-slate-400">{new Date(e.dateRange.start).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      e.status === 'Ongoing' ? 'bg-warning-light text-warning-dark' :
                      e.status === 'Completed' ? 'bg-success-light text-success-dark' :
                      'bg-info-light text-info-dark'
                    }`}>{e.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
