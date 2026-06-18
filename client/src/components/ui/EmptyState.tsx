import { type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Consistent empty / no-results placeholder used inside cards and tables. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('px-6 py-20 text-center', className)}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
        <Icon className="h-6 w-6 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
