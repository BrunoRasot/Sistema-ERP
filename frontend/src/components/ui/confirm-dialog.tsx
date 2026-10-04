import React from 'react';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const iconConfig = {
    danger: {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-rose-50 text-rose-600',
      btnVariant: 'danger' as const,
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600',
      btnVariant: 'primary' as const,
    },
    primary: {
      icon: <HelpCircle className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      btnVariant: 'primary' as const,
    },
  };

  const current = iconConfig[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      icon={current.icon}
      iconColor={current.color}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={current.btnVariant}
            size="sm"
            isLoading={isLoading}
            onClick={async () => {
              await onConfirm();
            }}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        {description}
      </p>
    </Modal>
  );
}
