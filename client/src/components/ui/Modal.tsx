import { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-md animate-fade-in" />

        {/* Centering wrapper — flexbox keeps the panel centered even while the
            scale-in animation animates `transform` (which would clobber a
            translate-based centering). */}
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Panel */}
          <Dialog.Content
            className={cn(
              'pointer-events-auto relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto',
              'rounded-2xl bg-white shadow-modal p-6 sm:p-8 border border-slate-200/70 ring-1 ring-black/5 animate-scale-in',
              sizeMap[size],
              className
            )}
          >
          {/* Header */}
          {(title || description) && (
            <div className="mb-6 pr-6">
              {title && (
                <Dialog.Title className="font-display text-xl font-bold text-slate-800 tracking-tight break-all">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="mt-1.5 text-sm text-slate-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
          )}

          {children}

          {/* Close button */}
          <Dialog.Close
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
