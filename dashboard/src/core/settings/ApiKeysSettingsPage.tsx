import React from 'react';
import { Button } from '../ui/Button';
import { useApiKeysState } from './useApiKeysState';
import { AiProviderSelector } from './AiProviderSelector';
import { StandardServicesSection } from './StandardServicesSection';
import { CustomKeysSection } from './CustomKeysSection';

export const ApiKeysSettingsPage: React.FC = () => {
  const {
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
  } = useApiKeysState();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando configuración de credenciales...</p>
      </div>
    );
  }

  const activeProvider = data?.active_translation_provider || 'nvidia_nim';

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

      {/* 0. AI Translation Provider Selector */}
      <AiProviderSelector
        activeProvider={activeProvider}
        switchingProvider={switchingProvider}
        onSelectProvider={handleSelectAiProvider}
      />

      {/* 1. Standard Integrations */}
      <StandardServicesSection
        services={data?.services || []}
        activeProvider={activeProvider}
        inputValues={inputValues}
        setInputValues={setInputValues}
        visibleInputs={visibleInputs}
        setVisibleInputs={setVisibleInputs}
        savingKey={savingKey}
        onSaveStandardKey={handleSaveStandardKey}
        testingService={testingService}
        testResults={testResults}
        onTestService={handleTestService}
      />

      {/* 2. Custom & Future Credentials */}
      <CustomKeysSection
        customKeys={data?.custom_keys}
        newKeyName={newKeyName}
        setNewKeyName={setNewKeyName}
        newKeyValue={newKeyValue}
        setNewKeyValue={setNewKeyValue}
        newKeyDesc={newKeyDesc}
        setNewKeyDesc={setNewKeyDesc}
        isAddingCustom={isAddingCustom}
        onAddCustomKey={handleAddCustomKey}
        keyToDelete={keyToDelete}
        setKeyToDelete={setKeyToDelete}
        isDeleting={isDeleting}
        onDeleteCustomKey={handleDeleteCustomKey}
      />
    </div>
  );
};
