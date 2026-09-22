import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { ApiKeysData, TestConnectionResult, ApiServiceId, AiTranslationProvider } from '../../api/types';
import { useToast } from '../ui/ToastContext';

export function useApiKeysState() {
  const [data, setData] = useState<ApiKeysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [switchingProvider, setSwitchingProvider] = useState(false);
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

  const handleSelectAiProvider = async (providerId: AiTranslationProvider) => {
    try {
      setSwitchingProvider(true);
      await api.settings.apiKeys.save('AI_TRANSLATION_PROVIDER', providerId, 'Proveedor activo de traducción con IA');
      toast.success(`Proveedor de traducción cambiado a ${providerId.toUpperCase()}.`);
      await loadApiKeys();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar proveedor de IA';
      toast.error(msg);
    } finally {
      setSwitchingProvider(false);
    }
  };

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

  const handleTestService = async (serviceId: ApiServiceId) => {
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

  return {
    data,
    loading,
    savingKey,
    switchingProvider,
    testingService,
    testResults,
    inputValues,
    setInputValues,
    visibleInputs,
    setVisibleInputs,
    newKeyName,
    setNewKeyName,
    newKeyValue,
    setNewKeyValue,
    newKeyDesc,
    setNewKeyDesc,
    isAddingCustom,
    keyToDelete,
    setKeyToDelete,
    isDeleting,
    loadApiKeys,
    handleSelectAiProvider,
    handleSaveStandardKey,
    handleTestService,
    handleAddCustomKey,
    handleDeleteCustomKey,
  };
}

