import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronDown, Users, Download } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody, Spinner, StatusBadge, Badge, Button } from '@/components/ui';
import { api } from '@/lib/api';
import type { Event } from '@/types';

interface SummaryData {
  sessions: { id: string; label: string }[];
  sections: Record<string, StudentAttendance[]>;
}

interface StudentAttendance {
  id: string;
  studentId: string;
  name: string;
  attendance: Record<string, string>;
}

export function AttendanceSummaryPage() {
  const [selectedEventId, setSelectedEventId] = useState('');

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<Event[]>('/events')).data,
  });

  useMemo(() => {
    if (!selectedEventId && events.length > 0) {
      const ongoing = events.find(e => e.status === 'Ongoing');
      setSelectedEventId(ongoing?._id || events[0]._id);
    }
  }, [events, selectedEventId]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance-summary', selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => (await api.get<SummaryData>(`/attendance/summary/${selectedEventId}`)).data,
  });

  const selectedEvent = events.find(e => e._id === selectedEventId);

  const exportToCSV = () => {
    if (!summary || !selectedEvent) return;

    const headers = ['Section', 'Student ID', 'Name', ...summary.sessions.map(s => s.label)];
    const rows = Object.entries(summary.sections).flatMap(([section, students]) =>
      students.map(s => [
        section,
        s.studentId,
        s.name,
        ...summary.sessions.map(sess => s.attendance[sess.id] || 'Absent')
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Summary_${selectedEvent.title}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageWrapper
      title="Attendance Summary"
      description="Consolidated AM/PM attendance records by section."
      actions={
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Select Event</option>
              {events.map((e) => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Button 
            variant="secondary" 
            onClick={exportToCSV}
            disabled={!summary}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      }
    >
      {summaryLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !summary ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No event selected</h3>
          <p className="text-sm text-slate-500">Please choose an event to view the attendance summary.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(summary.sections).map(([section, students]) => (
            <section key={section} className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <h3 className="font-display text-lg font-bold text-slate-900">Section: {section}</h3>
                <Badge variant="default" className="bg-slate-100 text-slate-600 font-bold">
                  {students.length} Students
                </Badge>
              </div>

              <Card>
                <CardBody className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Student ID</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                          {summary.sessions.map((session) => (
                            <th key={session.id} className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {session.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{student.studentId}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                            {summary.sessions.map((session) => (
                              <td key={session.id} className="px-6 py-4 text-center">
                                <StatusBadge status={student.attendance[session.id] as any || 'Absent'} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </section>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
