import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  requireDoubleConfirm?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Sí, confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  requireDoubleConfirm = true,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Reset step whenever the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  const handleInitialClick = () => {
    if (variant === 'danger' && requireDoubleConfirm) {
      setStep(2);
    } else {
      onConfirm();
    }
  };

  const handleCancel = () => {
    setStep(1);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={step === 2 ? '⚠️ Confirmación definitiva requerida' : title}
      maxWidth="md"
    >
      <div className="space-y-6">
        {step === 1 ? (
          <>
            <p className="text-sm text-secondary leading-relaxed">{message}</p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={variant}
                onClick={handleInitialClick}
                isLoading={isLoading}
                className="w-full sm:w-auto"
              >
                {variant === 'danger' && requireDoubleConfirm ? 'Continuar con el borrado →' : confirmText}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <p className="font-bold text-sm text-danger">ADVERTENCIA CRÍTICA: Acción permanente</p>
              </div>
              <p className="text-xs text-danger/90 leading-relaxed">
                Esta acción no se puede deshacer. El elemento seleccionado y todos sus datos relacionados se borrarán de forma irreversible de la base de datos.
              </p>
            </div>

            <p className="text-sm font-medium text-primary">
              ¿Confirmas que deseas proceder con la eliminación definitiva?
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                ← Volver al paso anterior
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onConfirm}
                isLoading={isLoading}
                className="w-full sm:w-auto shadow-sm"
              >
                💥 Sí, eliminar definitivamente
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

