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
  brand:   { border: 'border-l-brand-500',   chip: 'from-brand-500 to-brand-600',     glow: 'bg-brand-500/10'   },
  success: { border: 'border-l-success-500', chip: 'from-success-500 to-success-600', glow: 'bg-success-500/10' },
  warning: { border: 'border-l-warning-500', chip: 'from-warning-500 to-warning-600', glow: 'bg-warning-500/10' },
  danger:  { border: 'border-l-danger-500',  chip: 'from-danger-500 to-danger-600',   glow: 'bg-danger-500/10'  },
};

export function StatCard({ label, value, icon: Icon, trend, accent = 'brand', description }: StatCardProps) {
  const c = cfg[accent];
  return (
    <div className={cn(
      'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/70 bg-card-sheen px-5 py-4',
      'border-l-[3px] shadow-card transition-[transform,box-shadow] duration-300 ease-out-expo hover:shadow-card-hover hover:-translate-y-1 cursor-default',
      c.border,
    )}>
      {/* soft accent glow that intensifies on hover */}
      <div className={cn(
        'pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-60 transition-opacity duration-300 group-hover:opacity-100',
        c.glow,
      )} />

      {/* top row: label + icon chip */}
      <div className="relative flex items-center justify-between">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-btn transition-transform duration-300 ease-spring group-hover:scale-110',
          c.chip,
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* value */}
      <p className="relative mt-3 font-display text-[2rem] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>

      {/* description / trend */}
      <div className="relative mt-2 flex items-center justify-between">
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
