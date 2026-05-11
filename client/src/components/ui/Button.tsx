import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:   'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-md hover:shadow-brand-500/20 active:bg-brand-700 shadow-sm border border-brand-600/20',
        secondary: 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 border border-slate-200 shadow-sm',
        danger:    'bg-danger-500 text-white hover:bg-danger-600 hover:shadow-md hover:shadow-danger-500/20 active:bg-danger-700 shadow-sm border border-danger-600/20',
        ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
        link:      'text-brand-600 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
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
