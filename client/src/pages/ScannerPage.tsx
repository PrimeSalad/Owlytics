import { QrCode } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody } from '@/components/ui';

export function ScannerPage() {
  return (
    <PageWrapper title="QR Scanner" description="Scan student QR codes for the active session.">
      <Card>
        <CardBody className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
          <QrCode className="h-12 w-12 text-slate-300" />
          <p className="text-sm">Camera scanner — Phase 4</p>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
