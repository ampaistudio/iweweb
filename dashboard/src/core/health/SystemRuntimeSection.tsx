import React from 'react';
import type { SiteHealthStatusResponse } from '../../api/types';
import { Card } from '../ui/Card';
import { HealthSeverityBadge } from './HealthSeverityBadge';

interface SystemRuntimeSectionProps {
  runtime: SiteHealthStatusResponse['runtime'];
  checkedAt: string;
}

export const SystemRuntimeSection: React.FC<SystemRuntimeSectionProps> = ({
  runtime,
  checkedAt,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <span>⚙️</span> Entorno de Ejecución & Servidor
        </h2>
        <span className="text-xs text-secondary">
          Último chequeo: {checkedAt}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PHP Runtime */}
        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">{runtime.php.name}</span>
              <HealthSeverityBadge severity={runtime.php.severity} />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Versión en ejecución:</span>
                <span className="font-mono font-bold text-primary">{runtime.php.installed_version}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Última estable oficial:</span>
                <span className="font-mono text-secondary">{runtime.php.latest_version}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Límite de memoria:</span>
                <span className="font-mono text-secondary">{runtime.php.memory_limit}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <span className="text-[11px] text-secondary font-medium block mb-2">Extensiones de soporte:</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(runtime.php.extensions).map(([ext, ok]) => (
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
              <span className="font-semibold text-primary">{runtime.mysql.name}</span>
              <HealthSeverityBadge severity={runtime.mysql.severity} />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Versión del motor:</span>
                <span className="font-mono font-bold text-primary">{runtime.mysql.installed_version}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Base de datos activa:</span>
                <span className="font-mono text-secondary">{runtime.mysql.database_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Estado de conexión:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Conectado</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border text-xs text-secondary">
            <span>{runtime.mysql.status_text}</span>
          </div>
        </Card>

        {/* Web Server & OS */}
        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">{runtime.server.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-secondary font-mono">
                {runtime.server.os}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Software del servidor:</span>
                <span className="font-mono text-primary truncate max-w-[160px]" title={runtime.server.software}>
                  {runtime.server.software}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Hora del servidor:</span>
                <span className="font-mono text-secondary">{runtime.server.time}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border text-xs text-secondary">
            <span>Servidor web activo para el backend API y panel editorial.</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

