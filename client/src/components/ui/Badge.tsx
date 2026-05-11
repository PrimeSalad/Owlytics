import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider',
  {
    variants: {
      variant: {
        default:  'bg-slate-100 text-slate-600',
        primary:  'bg-brand-50 text-brand-700 border border-brand-200/50',
        success:  'bg-success-50 text-success-700 border border-success-200/50',
        warning:  'bg-warning-50 text-warning-700 border border-warning-200/50',
        danger:   'bg-danger-50 text-danger-700 border border-danger-200/50',
        info:     'bg-info-50 text-info-700 border border-info-200/50',
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
