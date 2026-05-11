import { Plus } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody } from '@/components/ui';

export function ReportsPage() {
  return (
    <PageWrapper
      title="Reports"
      description="Submit activity updates, emergency reports, and generate accomplishment PDFs."
      actions={<Button size="sm"><Plus className="h-4 w-4" />New Report</Button>}
    >
      <Card>
        <CardBody className="py-16 text-center text-slate-400 text-sm">
          Report list and submission — Phase 5
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
