import { UserPlus, Upload } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody } from '@/components/ui';

export function StudentsPage() {
  return (
    <PageWrapper
      title="Students"
      description="Manage the student database, import records, and distribute QR codes."
      actions={
        <>
          <Button variant="secondary" size="sm"><Upload className="h-4 w-4" />Import CSV</Button>
          <Button size="sm"><UserPlus className="h-4 w-4" />Add Student</Button>
        </>
      }
    >
      <Card>
        <CardBody className="py-16 text-center text-slate-400 text-sm">
          Student table — Phase 2
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
