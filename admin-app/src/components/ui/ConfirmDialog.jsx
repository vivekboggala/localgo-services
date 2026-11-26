import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'primary' | 'accent'
  loading = false,
  children = null,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal open={open} onClose={!loading ? onCancel : undefined} size="sm" title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-card flex items-center justify-center shrink-0 ${
              variant === 'danger' ? 'bg-rose-50 text-status-danger' : 'bg-brand-yellowSoft text-brand-ink'
            }`}
          >
            <AlertTriangle className="w-5 h-5" strokeWidth={2} />
          </div>
          <p className="text-ds-14 text-gray-600 leading-relaxed pt-1">{message}</p>
        </div>

        {children}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-6">
        <Button variant="secondary" fullWidth disabled={loading} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={variant} fullWidth loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
