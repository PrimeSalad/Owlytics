import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ title, description, actions, children, className }: PageWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-6 p-4 md:p-8 animate-fade-in max-w-[1400px] mx-auto', className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{title}</h2>}
            {description && <p className="mt-1.5 text-sm font-medium text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
