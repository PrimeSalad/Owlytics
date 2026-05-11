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
  brand:   'bg-brand-50 text-brand-600 border border-brand-100',
  success: 'bg-success-50 text-success-600 border border-success-100',
  warning: 'bg-warning-50 text-warning-600 border border-warning-100',
  danger:  'bg-danger-50 text-danger-600 border border-danger-100',
};

export function StatCard({ label, value, icon: Icon, trend, accent = 'brand' }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm p-6 flex items-start justify-between gap-4 transition-all duration-300 hover:shadow-md hover:border-slate-300 group">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="mt-2 font-display text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        {trend && (
          <p className={cn('mt-2 text-[11px] font-bold uppercase tracking-wider', trend.up ? 'text-success-600' : 'text-danger-600')}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3', accentMap[accent])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
