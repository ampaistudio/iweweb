import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type {
  SiteHealthStatusResponse,
  BackupItem,
  ComponentHealth,
  HealthSeverity,
} from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const SiteHealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<SiteHealthStatusResponse | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'dashboard'>('all');

  const toast = useToast();

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const [statusRes, backupsRes] = await Promise.all([
        api.health.getStatus(forceRefresh),
        api.health.listBackups(),
      ]);

      if (statusRes) {
        setHealthData(statusRes);
      }
      if (backupsRes && backupsRes.backups) {
        setBackups(backupsRes.backups);
      }
      if (forceRefresh) {
        toast.success('Diagnóstico de versiones actualizado desde los registros oficiales.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el diagnóstico de salud';
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const res = await api.health.createBackup();
      if (res) {
        toast.success(`Respaldo creado con éxito (${res.size_human}).`);
        // Refresh backups list
        const backupsRes = await api.health.listBackups();
        if (backupsRes && backupsRes.backups) {
          setBackups(backupsRes.backups);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar el respaldo';
      toast.error(msg);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleNotifyTelegram = async () => {
    try {
      setSendingTelegram(true);
      await api.health.notifyTelegram();
      toast.success('Reporte de salud enviado correctamente al canal de Telegram.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar la notificación por Telegram';
      toast.error(msg);
    } finally {
      setSendingTelegram(false);
    }
  };

  const getSeverityBadge = (severity: HealthSeverity, text?: string) => {
    switch (severity) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {text || 'Al día'}
          </span>
        );
      case 'yellow':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {text || 'Actualización menor'}
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {text || 'Actualización mayor'}
          </span>
        );
    }
  };

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
            {healthData && getSeverityBadge(healthData.status, healthData.status === 'green' ? 'Saludable' : healthData.status === 'yellow' ? 'Atención Requerida' : 'Actualizaciones Pendientes')}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <span>⚙️</span> Entorno de Ejecución & Servidor
            </h2>
            <span className="text-xs text-secondary">
              Último chequeo: {healthData.checked_at}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PHP Runtime */}
            <Card className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">{healthData.runtime.php.name}</span>
                  {getSeverityBadge(healthData.runtime.php.severity)}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Versión en ejecución:</span>
                    <span className="font-mono font-bold text-primary">{healthData.runtime.php.installed_version}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Última estable oficial:</span>
                    <span className="font-mono text-secondary">{healthData.runtime.php.latest_version}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Límite de memoria:</span>
                    <span className="font-mono text-secondary">{healthData.runtime.php.memory_limit}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <span className="text-[11px] text-secondary font-medium block mb-2">Extensiones de soporte:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(healthData.runtime.php.extensions).map(([ext, ok]) => (
                    <span
                      key={ext}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {ok ? '✓' : '✗'} {ext}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Database */}
            <Card className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">{healthData.runtime.mysql.name}</span>
                  {getSeverityBadge(healthData.runtime.mysql.severity)}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Versión del motor:</span>
                    <span className="font-mono font-bold text-primary">{healthData.runtime.mysql.installed_version}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Base de datos activa:</span>
                    <span className="font-mono text-secondary">{healthData.runtime.mysql.database_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Estado de conexión:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Conectado</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border text-xs text-secondary">
                <span>{healthData.runtime.mysql.status_text}</span>
              </div>
            </Card>

            {/* Web Server & OS */}
            <Card className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">{healthData.runtime.server.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-secondary font-mono">
                    {healthData.runtime.server.os}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Software del servidor:</span>
                    <span className="font-mono text-primary truncate max-w-[160px]" title={healthData.runtime.server.software}>
                      {healthData.runtime.server.software}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Hora del servidor:</span>
                    <span className="font-mono text-secondary">{healthData.runtime.server.time}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border text-xs text-secondary">
                <span>Servidor web activo para el backend API y panel editorial.</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SECTION 2: 1-Click Backup & Snapshot Manager */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <span>📦</span> Respaldos Manuales del Sitio (1-Click Backup)
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Genera un archivo ZIP con el volcado completo de la base de datos MySQL (`database.sql`), credenciales locales y todas las fotos subidas.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="flex items-center gap-2 shrink-0"
          >
            {creatingBackup ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando Respaldo...
              </>
            ) : (
              <>
                <span>💾</span> Hacer Backup Ahora
              </>
            )}
          </Button>
        </div>

        <Card className="overflow-hidden">
          {backups.length === 0 ? (
            <div className="p-8 text-center text-secondary text-sm">
              <p className="text-2xl mb-2">📁</p>
              <p className="font-medium text-primary">No hay respaldos generados todavía</p>
              <p className="text-xs mt-1">Haz click en "Hacer Backup Ahora" para generar el primer respaldo completo del sitio.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-elevated/60 text-secondary border-b border-border text-xs font-semibold">
                  <tr>
                    <th className="py-3 px-4">Archivo de Respaldo</th>
                    <th className="py-3 px-4">Tamaño</th>
                    <th className="py-3 px-4">Fecha de Generación</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {backups.map((b) => (
                    <tr key={b.filename} className="hover:bg-surface-elevated/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-primary flex items-center gap-2">
                        <span>📦</span>
                        {b.filename}
                      </td>
                      <td className="py-3 px-4 text-secondary font-mono">{b.size_human}</td>
                      <td className="py-3 px-4 text-secondary">{b.created_at}</td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={api.health.getDownloadUrl(b.filename)}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-soft text-accent-text hover:bg-accent hover:text-white transition-colors"
                        >
                          <span>⬇️</span> Descargar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 3: Frontend & Dashboard Dependencies Table */}
      {healthData && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <span>📚</span> Diagnóstico de Dependencias de Software
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Comparación de paquetes instalados en el proyecto vs. últimas versiones estables en el registro oficial de NPM.
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex bg-surface-elevated p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'all' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Todos ({healthData.dependencies.web.length + healthData.dependencies.dashboard.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('web')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'web' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Web Pública ({healthData.dependencies.web.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'dashboard' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Dashboard ({healthData.dependencies.dashboard.length})
              </button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-elevated/60 text-secondary border-b border-border text-xs font-semibold">
                  <tr>
                    <th className="py-3 px-4">Paquete & Propósito</th>
                    <th className="py-3 px-4">Entorno</th>
                    <th className="py-3 px-4">Instalada</th>
                    <th className="py-3 px-4">Última NPM</th>
                    <th className="py-3 px-4">Estado / Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(activeTab === 'all' || activeTab === 'web' ? healthData.dependencies.web.map((d: ComponentHealth) => ({ ...d, env: 'Web Pública' })) : [])
                    .concat(activeTab === 'all' || activeTab === 'dashboard' ? healthData.dependencies.dashboard.map((d: ComponentHealth) => ({ ...d, env: 'Dashboard' })) : [])
                    .map((item, idx) => (
                      <tr key={`${item.env}-${item.package_name}-${idx}`} className="hover:bg-surface-elevated/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-primary block">{item.package_name}</span>
                          <span className="text-xs text-secondary block">{item.description}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            item.env === 'Web Pública' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          }`}>
                            {item.env}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-primary">
                          {item.installed_version}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-secondary">
                          {item.latest_version}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(item.severity, item.status_text)}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SECTION 4: Telegram Bot Alerts Configuration */}
      {healthData && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <span>📢</span> Alertas Proactivas por Telegram
          </h2>

          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-primary">Bot de Alertas de Salud</span>
                  {healthData.telegram.is_configured ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      ✓ Configurado y activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      ⚠️ No configurado
                    </span>
                  )}
                </div>
                <p className="text-xs text-secondary">
                  El sistema envía un reporte automático a tu Telegram si algún componente de software pasa a estado crítico (🔴) y permite emitir reportes manuales en cualquier momento sin costo alguno.
                </p>

                {healthData.telegram.is_configured ? (
                  <div className="flex items-center gap-4 text-xs font-mono text-secondary pt-1">
                    <span>Token: <strong className="text-primary">{healthData.telegram.masked_token}</strong></span>
                    <span>Chat ID: <strong className="text-primary">{healthData.telegram.chat_id}</strong></span>
                  </div>
                ) : (
                  <div className="text-xs text-secondary pt-1">
                    Para habilitar avisos, carga <code>TELEGRAM_BOT_TOKEN</code> y <code>TELEGRAM_CHAT_ID</code> en la pantalla de{' '}
                    <Link to="/settings/api-keys" className="text-accent underline font-medium">
                      Integraciones & API Keys
                    </Link>.
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleNotifyTelegram}
                  disabled={!healthData.telegram.is_configured || sendingTelegram}
                  className="flex items-center justify-center gap-2"
                >
                  {sendingTelegram ? (
                    <>
                      <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <span>📨</span> Notificar ahora por Telegram
                    </>
                  )}
                </Button>
                <Link
                  to="/settings/api-keys"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-surface-elevated hover:bg-surface-hover text-secondary hover:text-primary border border-border transition-colors text-center"
                >
                  <span>🔐</span> Configurar Credenciales
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

