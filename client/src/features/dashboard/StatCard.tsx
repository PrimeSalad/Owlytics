import { ElementType } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  trend?: { value: string; up: boolean };
  accent?: 'brand' | 'success' | 'warning' | 'danger';
}

const accentMap = {
  brand:   'bg-brand-100 text-brand-600',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  danger:  'bg-danger-light text-danger-dark',
};

export function StatCard({ label, value, icon: Icon, trend, accent = 'brand' }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white border border-surface-border shadow-card p-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-semibold text-slate-900">{value}</p>
        {trend && (
          <p className={cn('mt-1 text-xs font-medium', trend.up ? 'text-success-dark' : 'text-danger-dark')}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', accentMap[accent])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
