import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex flex-col items-center gap-2', className)}>
      <svg
        className={cn('animate-spin-slow text-brand-500', sizeMap[size])}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-15" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
        <path
          className="opacity-90"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          d="M21 12a9 9 0 0 0-9-9"
        />
      </svg>
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <span className="sr-only">{label ?? 'Loading…'}</span>
    </span>
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <Spinner size="lg" label="Loading…" />
    </div>
  );
}
