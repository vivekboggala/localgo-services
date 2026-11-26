import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer = null,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/75 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal dialog'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`w-full ${SIZE_MAP[size] || SIZE_MAP.md} bg-brand-white dark:bg-gray-900 rounded-sheet border border-gray-200 dark:border-gray-600/30 shadow-panel overflow-hidden animate-modal-pop flex flex-col max-h-[90vh]`}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-600/20">
            <div>
              {title && <h3 className="font-display font-bold text-ds-20 text-brand-ink dark:text-brand-white">{title}</h3>}
              {subtitle && <p className="text-ds-12 text-gray-600 dark:text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <IconButton
                icon={<X className="w-5 h-5" strokeWidth={2} />}
                label="Close dialog"
                variant="ghost"
                rounded="pill"
                onClick={onClose}
              />
            )}
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 py-4 bg-gray-50 dark:bg-brand-ink border-t border-gray-200 dark:border-gray-600/30 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
