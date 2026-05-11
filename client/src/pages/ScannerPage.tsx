import { Camera } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody } from '@/components/ui';

export function ScannerPage() {
  return (
    <PageWrapper title="QR Scanner" description="Scan student QR codes for the active session.">
      <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
        <CardBody className="flex flex-col items-center justify-center py-32 gap-5 text-slate-400">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 rounded-full animate-pulse" />
            <div className="relative h-20 w-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
              <Camera className="h-10 w-10 text-brand-500" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-display text-lg font-bold text-slate-800 tracking-tight">Camera Scanner Module</h3>
            <p className="text-sm font-medium text-slate-500">To be implemented in Phase 4</p>
          </div>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
