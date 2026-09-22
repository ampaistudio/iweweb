import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useSiteHealthState } from './useSiteHealthState';
import { HealthSeverityBadge } from './HealthSeverityBadge';
import { SystemRuntimeSection } from './SystemRuntimeSection';
import { BackupsManagerSection } from './BackupsManagerSection';
import { DependenciesTableSection } from './DependenciesTableSection';
import { TelegramAlertsSection } from './TelegramAlertsSection';

export const SiteHealthPage: React.FC = () => {
  const {
    healthData,
    backups,
    loading,
    refreshing,
    creatingBackup,
    sendingTelegram,
    activeTab,
    setActiveTab,
    loadData,
    handleCreateBackup,
    handleNotifyTelegram,
  } = useSiteHealthState();

  if (loading && !healthData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Realizando diagnóstico integral del sitio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Main Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-primary">🩺 Salud del Sitio & Diagnóstico</h1>
            {healthData && (
              <HealthSeverityBadge
                severity={healthData.status}
                text={
                  healthData.status === 'green'
                    ? 'Saludable'
                    : healthData.status === 'yellow'
                    ? 'Atención Requerida'
                    : 'Actualizaciones Pendientes'
                }
              />
            )}
          </div>
          <p className="text-sm text-secondary mt-1 max-w-2xl">
            Inspección en tiempo real de versiones en ejecución, respaldos de base de datos y archivos con 1 click, y alertas proactivas a Telegram.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            {refreshing ? 'Verificando...' : 'Comprobar ahora'}
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {healthData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary font-medium">Total Componentes</p>
              <p className="text-2xl font-bold text-primary mt-1">{healthData.summary.total_components}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-lg">
              📦
            </div>
          </Card>
          <Card className="p-4 flex items-center justify-between border-emerald-500/20 bg-emerald-500/[0.02]">
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Al día</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{healthData.summary.up_to_date_count}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg text-emerald-500">
              🟢
            </div>
          </Card>
          <Card className="p-4 flex items-center justify-between border-amber-500/20 bg-amber-500/[0.02]">
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Actualización menor</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{healthData.summary.minor_update_count}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg text-amber-500">
              🟡
            </div>
          </Card>
          <Card className="p-4 flex items-center justify-between border-rose-500/20 bg-rose-500/[0.02]">
            <div>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Actualización mayor / EOL</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{healthData.summary.major_update_count}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-lg text-rose-500">
              🔴
            </div>
          </Card>
        </div>
      )}

      {/* SECTION 1: System Runtime (PHP, MySQL, Web Server) */}
      {healthData && (
        <SystemRuntimeSection
          runtime={healthData.runtime}
          checkedAt={healthData.checked_at}
        />
      )}

      {/* SECTION 2: 1-Click Backup & Snapshot Manager */}
      <BackupsManagerSection
        backups={backups}
        creatingBackup={creatingBackup}
        onCreateBackup={handleCreateBackup}
      />

      {/* SECTION 3: Frontend & Dashboard Dependencies Table */}
      {healthData && (
        <DependenciesTableSection
          dependencies={healthData.dependencies}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* SECTION 4: Telegram Bot Alerts Configuration */}
      {healthData && (
        <TelegramAlertsSection
          telegram={healthData.telegram}
          sendingTelegram={sendingTelegram}
          onNotifyTelegram={handleNotifyTelegram}
        />
      )}
    </div>
  );
};

export default SiteHealthPage;
