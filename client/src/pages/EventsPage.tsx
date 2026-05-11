import { Plus } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody } from '@/components/ui';

export function EventsPage() {
  return (
    <PageWrapper
      title="Events"
      description="Create and manage organizational events and activities."
      actions={<Button size="sm"><Plus className="h-4 w-4" />New Event</Button>}
    >
      <Card>
        <CardBody className="py-16 text-center text-slate-400 text-sm">
          Event list — Phase 3
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
