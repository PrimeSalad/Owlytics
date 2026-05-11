import { Plus } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody } from '@/components/ui';

export function AttendancePage() {
  return (
    <PageWrapper
      title="Attendance"
      description="Create schedules, monitor sessions, and export records."
      actions={<Button size="sm"><Plus className="h-4 w-4" />New Schedule</Button>}
    >
      <Card>
        <CardBody className="py-16 text-center text-slate-400 text-sm">
          Attendance scheduler and records — Phase 4
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
