import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { ApiKeysData, TestConnectionResult } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export const ApiKeysSettingsPage: React.FC = () => {
  const [data, setData] = useState<ApiKeysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestConnectionResult | { success: false; message: string }>>({});

  // Input states for editing keys: [key_name]: new_value
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [visibleInputs, setVisibleInputs] = useState<Record<string, boolean>>({});

  // Generic key form
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyDesc, setNewKeyDesc] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Deletion modal for generic key
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const res = await api.settings.apiKeys.get();
      if (res) {
        setData(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar las API keys';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleSaveStandardKey = async (keyName: string) => {
    const val = inputValues[keyName];
    if (val === undefined) return;

    try {
      setSavingKey(keyName);
      await api.settings.apiKeys.save(keyName, val);
      toast.success(`La credencial '${keyName}' ha sido actualizada.`);
      // Clear input value so it returns to masked display
      setInputValues((prev) => {
        const next = { ...prev };
        delete next[keyName];
        return next;
      });
      await loadApiKeys();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la credencial';
      toast.error(msg);
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestService = async (serviceId: 'nvidia_nim' | 'meta' | 'google_places' | 'tripadvisor') => {
    try {
      setTestingService(serviceId);
      const res = await api.settings.apiKeys.testConnection(serviceId);
      setTestResults((prev) => ({ ...prev, [serviceId]: res }));
      if (res.success) {
        toast.success(`Prueba exitosa (${res.latency_ms}ms): ${res.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fallo en la prueba de conexión';
      setTestResults((prev) => ({ ...prev, [serviceId]: { success: false, message: msg } }));
      toast.error(msg);
    } finally {
      setTestingService(null);
    }
  };

  const handleAddCustomKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = newKeyName.trim().toUpperCase();

    if (!formattedName) {
      toast.error('El nombre de la variable es obligatorio.');
      return;
    }

    if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(formattedName)) {
      toast.error('El formato debe ser NOMBRE_VARIABLE (mayúsculas, números y guiones bajos).');
      return;
    }

    if (!newKeyValue.trim()) {
      toast.error('El valor de la credencial no puede estar vacío.');
      return;
    }

    try {
      setIsAddingCustom(true);
      await api.settings.apiKeys.save(formattedName, newKeyValue.trim(), newKeyDesc.trim());
      toast.success(`Credencial personalizada '${formattedName}' agregada.`);
      setNewKeyName('');
      setNewKeyValue('');
      setNewKeyDesc('');
      await loadApiKeys();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agregar la credencial';
      toast.error(msg);
    } finally {
      setIsAddingCustom(false);
    }
  };

  const handleDeleteCustomKey = async () => {
    if (!keyToDelete) return;

    try {
      setIsDeleting(true);
      await api.settings.apiKeys.deleteCustom(keyToDelete);
      toast.success(`Credencial '${keyToDelete}' eliminada.`);
      setKeyToDelete(null);
      await loadApiKeys();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la credencial';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando configuración de credenciales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2.5">
              <span>🔐</span> Configuración de Integraciones & API Keys
            </h1>
            <p className="text-sm text-muted mt-1">
              Centraliza las credenciales de servicios externos, inteligencia artificial y automatizaciones de iWE.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadApiKeys}
            className="self-start sm:self-auto"
          >
            🔄 Recargar estado
          </Button>
        </div>

        {/* Security & Storage Note */}
        <div className="mt-4 p-4 rounded-2xl bg-surface-elevated border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-secondary">
            <span className="text-base">🛡️</span>
            <div>
              <p className="font-semibold text-primary">Almacenamiento Seguro Fuera de Git</p>
              <p className="text-muted">
                Archivo de persistencia: <code className="bg-bg px-1.5 py-0.5 rounded border border-border font-mono">{data?.storage_file}</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${data?.is_writable ? 'bg-success' : 'bg-danger'}`} />
            <span className="font-medium text-secondary">
              {data?.is_writable ? 'Permisos de escritura OK' : 'Directorio protegido / Solo lectura'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Standard Integrations */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary">Integraciones Oficiales del Sistema</h2>
            <p className="text-xs text-muted">Servicios conectados activamente al backend y frontend de iWE.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {data?.services.map((service) => {
            const hasAnyConfigured = service.keys.some((k) => k.is_configured);
            const isAllConfigured = service.keys.filter((k) => k.is_required).every((k) => k.is_configured);
            const testRes = testResults[service.id];

            return (
              <Card
                key={service.id}
                title={service.title}
                subtitle={service.description}
                action={
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isAllConfigured
                          ? 'bg-success/15 text-success border border-success/30'
                          : hasAnyConfigured
                          ? 'bg-warning/15 text-warning border border-warning/30'
                          : 'bg-muted/15 text-muted border border-border'
                      }`}
                    >
                      {isAllConfigured ? '● Activa y configurada' : hasAnyConfigured ? '◐ Parcialmente configurada' : '○ No configurada'}
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
                                  onClick={() => handleSaveStandardKey(keyItem.key_name)}
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
                      onClick={() => handleTestService(service.id)}
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

      {/* 2. Custom & Future Credentials */}
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
          <form onSubmit={handleAddCustomKey} className="space-y-4">
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
        {data?.custom_keys && data.custom_keys.length > 0 ? (
          <Card
            title={`Credenciales Personalizadas Guardadas (${data.custom_keys.length})`}
            subtitle="Variables registradas en el servidor"
          >
            <div className="divide-y divide-border">
              {data.custom_keys.map((ck) => (
                <div key={ck.key_name} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary">{ck.key_name}</span>
                      <span className="font-mono text-xs text-muted bg-surface-elevated px-2 py-0.5 rounded border border-border">
                        {ck.masked_value}
                      </span>
                    </div>
                    {ck.description && <p className="text-xs text-secondary">{ck.description}</p>}
                    {ck.updated_at && <p className="text-[10px] text-muted">Última actualización: {ck.updated_at}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setKeyToDelete(ck.key_name)}
                      className="text-danger-text hover:text-danger hover:bg-danger/10"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="p-8 rounded-2xl bg-surface-elevated border border-dashed border-border text-center text-muted text-xs">
            No hay credenciales personalizadas adicionales registradas aún.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={keyToDelete !== null}
        onClose={() => setKeyToDelete(null)}
        onConfirm={handleDeleteCustomKey}
        title="Eliminar credencial personalizada"
        message={`¿Estás seguro de que deseas eliminar la variable '${keyToDelete}' del archivo de configuración del servidor?`}
        confirmText="Eliminar credencial"
        isLoading={isDeleting}
      />
    </div>
  );
};
