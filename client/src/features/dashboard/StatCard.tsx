import { ElementType } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  trend?: { value: string; up: boolean };
  accent?: 'brand' | 'success' | 'warning' | 'danger';
  description?: string;
}

const cfg = {
  brand:   { border: 'border-l-brand-500',   icon: 'text-brand-500',   bg: 'bg-brand-500'   },
  success: { border: 'border-l-success-500', icon: 'text-success-500', bg: 'bg-success-500' },
  warning: { border: 'border-l-warning-500', icon: 'text-warning-500', bg: 'bg-warning-500' },
  danger:  { border: 'border-l-danger-500',  icon: 'text-danger-500',  bg: 'bg-danger-500'  },
};

export function StatCard({ label, value, icon: Icon, trend, accent = 'brand', description }: StatCardProps) {
  const c = cfg[accent];
  return (
    <div className={cn(
      'relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-4',
      'border-l-[3px] shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px cursor-default',
      c.border,
    )}>
      {/* top row: label + icon */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
        <Icon className={cn('h-4 w-4', c.icon)} />
      </div>

      {/* value */}
      <p className="mt-3 font-display text-[2rem] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>

      {/* description / trend */}
      <div className="mt-2 flex items-center justify-between">
        {description && (
          <p className="font-sans text-[11px] text-slate-400">{description}</p>
        )}
        {trend && (
          <span className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold',
            trend.up ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600',
          )}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
