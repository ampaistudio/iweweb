import React from 'react';
import type { ApiKeysData } from '../../api/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface CustomKeysSectionProps {
  customKeys?: ApiKeysData['custom_keys'];
  newKeyName: string;
  setNewKeyName: React.Dispatch<React.SetStateAction<string>>;
  newKeyValue: string;
  setNewKeyValue: React.Dispatch<React.SetStateAction<string>>;
  newKeyDesc: string;
  setNewKeyDesc: React.Dispatch<React.SetStateAction<string>>;
  isAddingCustom: boolean;
  onAddCustomKey: (e: React.FormEvent) => void;
  keyToDelete: string | null;
  setKeyToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  isDeleting: boolean;
  onDeleteCustomKey: () => void;
}

export const CustomKeysSection: React.FC<CustomKeysSectionProps> = ({
  customKeys,
  newKeyName,
  setNewKeyName,
  newKeyValue,
  setNewKeyValue,
  newKeyDesc,
  setNewKeyDesc,
  isAddingCustom,
  onAddCustomKey,
  keyToDelete,
  setKeyToDelete,
  isDeleting,
  onDeleteCustomKey,
}) => {
  return (
    <div className="space-y-6 pt-4">
      <div>
        <h2 className="text-lg font-bold text-primary">Credenciales Personalizadas & Futuras</h2>
        <p className="text-xs text-muted">
          Registra cualquier clave para bots de Telegram, webhooks de automatización (n8n, Zapier) o integraciones nuevas sin modificar código.
        </p>
      </div>

      {/* New custom key form */}
      <Card
        title="Agregar Nueva Credencial al Servidor"
        subtitle="Se almacenará de forma segura en config.local.php lista para ser leída por getenv() o la configuración."
      >
        <form onSubmit={onAddCustomKey} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Nombre de la Variable (ENV)
              </label>
              <input
                type="text"
                placeholder="EJ: TELEGRAM_BOT_TOKEN"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value.toUpperCase())}
                className="w-full h-10 px-3 rounded-lg bg-bg border border-border text-sm font-mono text-primary placeholder:text-muted focus:outline-none focus:border-accent"
              />
              <p className="text-[11px] text-muted mt-1">Formato: mayúsculas y guiones bajos.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Valor Secreto de la Clave
              </label>
              <input
                type="password"
                placeholder="Pegar token o secret..."
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-bg border border-border text-sm font-mono text-primary placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <Input
              label="Descripción o Propósito de la Credencial"
              placeholder="Ej: Token del bot de Telegram para notificaciones automáticas de reservas"
              value={newKeyDesc}
              onChange={(e) => setNewKeyDesc(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={isAddingCustom}>
              ➕ Guardar credencial personalizada
            </Button>
          </div>
        </form>
      </Card>

      {/* List of custom keys */}
      {customKeys && customKeys.length > 0 ? (
        <Card
          title={`Credenciales Personalizadas Guardadas (${customKeys.length})`}
          subtitle="Variables registradas en el servidor"
        >
          <div className="divide-y divide-border">
            {customKeys.map((ck) => (
              <div key={ck.key_name} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{ck.key_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-secondary">
                      {ck.is_configured ? 'Configurada' : 'Vacía'}
                    </span>
                  </div>
                  {ck.description && <p className="text-xs text-muted">{ck.description}</p>}
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span>Valor: <code className="font-mono text-primary">{ck.masked_value || '(vacío)'}</code></span>
                    {ck.updated_at && <span>• Actualizado: {ck.updated_at}</span>}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setKeyToDelete(ck.key_name)}
                >
                  🗑️ Eliminar
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Delete Confirmation Modal */}
      {keyToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Eliminar Credencial Personalizada"
          message={`¿Estás seguro de que deseas eliminar permanentemente la credencial '${keyToDelete}' de config.local.php? Las integraciones que dependan de esta variable podrían dejar de funcionar.`}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={onDeleteCustomKey}
          onClose={() => setKeyToDelete(null)}
        />
      )}
    </div>
  );
};
