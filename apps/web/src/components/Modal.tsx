'use client';

import type { ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Button } from '@/libs/ui/Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthClasses: Record<NonNullable<ModalProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
}: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full ${maxWidthClasses[maxWidth]} rounded-ps border border-ps-border bg-ps-bg-card shadow-ps`}
        >
          <div className="flex items-start justify-between border-b border-ps-border px-4 py-3">
            <DialogTitle className="text-lg font-semibold text-ps-fg">
              {title}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-ps-fg-muted"
            >
              Close
            </Button>
          </div>

          <div className="px-4 py-3">{children}</div>

          {footer && (
            <div className="border-t border-ps-border px-4 py-3">{footer}</div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

