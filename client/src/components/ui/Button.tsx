import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ease-out-expo focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:   'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-btn border border-brand-700/30 hover:shadow-brand-glow hover:from-brand-500 hover:to-brand-700 active:from-brand-600 active:to-brand-700',
        secondary: 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:bg-slate-100 border border-slate-200 shadow-card',
        danger:    'bg-gradient-to-b from-danger-500 to-danger-600 text-white shadow-btn border border-danger-700/30 hover:shadow-[0_8px_24px_-6px_rgb(239_68_68_/_0.45)] hover:to-danger-700 active:to-danger-700',
        ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
        link:      'text-brand-600 underline-offset-4 hover:underline p-0 h-auto active:scale-100',
      },
      size: {
        xs:   'h-7 px-2.5 text-[11px]',
        sm:   'h-8 px-3 text-xs',
        md:   'h-10 px-4 text-sm',
        lg:   'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
