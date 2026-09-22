import React from 'react';
import type { ApiKeysData, TestConnectionResult, ApiServiceId } from '../../api/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface StandardServicesSectionProps {
  services: ApiKeysData['services'];
  activeProvider: string;
  inputValues: Record<string, string>;
  setInputValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  visibleInputs: Record<string, boolean>;
  setVisibleInputs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  savingKey: string | null;
  onSaveStandardKey: (keyName: string) => void;
  testingService: string | null;
  testResults: Record<string, TestConnectionResult | { success: false; message: string }>;
  onTestService: (serviceId: ApiServiceId) => void;
}

export const StandardServicesSection: React.FC<StandardServicesSectionProps> = ({
  services,
  activeProvider,
  inputValues,
  setInputValues,
  visibleInputs,
  setVisibleInputs,
  savingKey,
  onSaveStandardKey,
  testingService,
  testResults,
  onTestService,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary">Integraciones Oficiales del Sistema</h2>
          <p className="text-xs text-muted">Servicios conectados activamente al backend y frontend de iWE.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {services.map((service) => {
          const hasAnyConfigured = service.keys.some((k) => k.is_configured);
          const isAllConfigured = service.keys.filter((k) => k.is_required).every((k) => k.is_configured);
          const isCurrentAiActive = service.id === activeProvider;
          const testRes = testResults[service.id];

          return (
            <Card
              key={service.id}
              title={service.title}
              subtitle={service.description}
              action={
                <div className="flex items-center gap-2">
                  {isCurrentAiActive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent-contrast">
                      MOTOR IA ACTIVO
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isAllConfigured && hasAnyConfigured
                        ? 'bg-success/15 text-success border border-success/30'
                        : hasAnyConfigured
                        ? 'bg-warning/15 text-warning border border-warning/30'
                        : 'bg-muted/15 text-muted border border-border'
                    }`}
                  >
                    {isAllConfigured && hasAnyConfigured
                      ? '● Configurada'
                      : hasAnyConfigured
                      ? '◐ Parcialmente configurada'
                      : '○ No configurada'}
                  </span>
                </div>
              }
            >
              <div className="space-y-5">
                {/* Keys list */}
                <div className="space-y-4 divide-y divide-border/40">
                  {service.keys.map((keyItem) => {
                    const isEditing = inputValues[keyItem.key_name] !== undefined;
                    const currentValue = isEditing ? inputValues[keyItem.key_name] : keyItem.masked_value;
                    const isVisible = visibleInputs[keyItem.key_name] || false;

                    return (
                      <div key={keyItem.key_name} className="pt-3.5 first:pt-0 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <label className="text-xs font-bold text-primary font-mono flex items-center gap-2">
                            {keyItem.key_name}
                            {keyItem.is_required && (
                              <span className="text-[10px] text-danger font-sans uppercase font-bold">
                                Requerida
                              </span>
                            )}
                          </label>
                          <span className="text-[11px] text-muted">{keyItem.description}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={isVisible || !keyItem.is_configured || isEditing ? 'text' : 'password'}
                              value={currentValue}
                              placeholder={keyItem.is_configured ? '••••••••••••••••' : `Ingresar ${keyItem.label}...`}
                              onChange={(e) =>
                                setInputValues((prev) => ({ ...prev, [keyItem.key_name]: e.target.value }))
                              }
                              className="w-full h-9 px-3 rounded-lg bg-bg border border-border text-xs text-primary font-mono focus:outline-none focus:border-accent"
                            />
                            {keyItem.is_configured && !isEditing && (
                              <button
                                type="button"
                                onClick={() =>
                                  setVisibleInputs((prev) => ({
                                    ...prev,
                                    [keyItem.key_name]: !prev[keyItem.key_name],
                                  }))
                                }
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary text-xs cursor-pointer"
                                title="Mostrar / Ocultar"
                              >
                                {isVisible ? '🙈' : '👁️'}
                              </button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="flex gap-1.5">
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                isLoading={savingKey === keyItem.key_name}
                                onClick={() => onSaveStandardKey(keyItem.key_name)}
                              >
                                Guardar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setInputValues((prev) => {
                                    const next = { ...prev };
                                    delete next[keyItem.key_name];
                                    return next;
                                  })
                                }
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setInputValues((prev) => ({ ...prev, [keyItem.key_name]: '' }))
                              }
                            >
                              {keyItem.is_configured ? 'Modificar' : 'Cargar'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions & Live Connection Test */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-elevated/40 p-3 rounded-xl">
                  <div className="text-xs text-muted flex items-center gap-1.5">
                    <span>📖 Documentación:</span>
                    <a
                      href={service.docs_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline font-medium"
                    >
                      {service.docs_url.replace('https://', '')} ↗
                    </a>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={testingService === service.id}
                    onClick={() => onTestService(service.id)}
                  >
                    ⚡ Probar conexión en vivo
                  </Button>
                </div>

                {/* Test Result Banner */}
                {testRes && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      testRes.success
                        ? 'bg-success/10 border border-success/30 text-success'
                        : 'bg-danger/10 border border-danger/30 text-danger'
                    }`}
                  >
                    <span className="text-base leading-none">{testRes.success ? '✅' : '❌'}</span>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {testRes.success
                          ? `Conexión verificada con éxito (${(testRes as TestConnectionResult).latency_ms}ms)`
                          : 'Fallo al verificar credencial'}
                      </p>
                      <p className="mt-0.5 opacity-90">{testRes.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

