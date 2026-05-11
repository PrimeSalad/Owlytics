import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default:  'bg-surface-subtle text-slate-600',
        primary:  'bg-brand-100 text-brand-700',
        success:  'bg-success-light text-success-dark',
        warning:  'bg-warning-light text-warning-dark',
        danger:   'bg-danger-light text-danger-dark',
        info:     'bg-info-light text-info-dark',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Convenience: map status strings to badge variants
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
    Planning: 'info', Ongoing: 'warning', Completed: 'success', Cancelled: 'danger',
    Present: 'success', Late: 'warning', Absent: 'danger',
    Pending: 'default', InProgress: 'warning', Done: 'success',
    Update: 'info', Emergency: 'danger', Accomplishment: 'success',
  };
  return <Badge variant={map[status] ?? 'default'}>{status}</Badge>;
}
