import React from 'react';
import type { SiteHealthStatusResponse, ComponentHealth } from '../../api/types';
import { Card } from '../ui/Card';
import { HealthSeverityBadge } from './HealthSeverityBadge';

interface DependenciesTableSectionProps {
  dependencies: SiteHealthStatusResponse['dependencies'];
  activeTab: 'all' | 'web' | 'dashboard';
  setActiveTab: (tab: 'all' | 'web' | 'dashboard') => void;
}

export const DependenciesTableSection: React.FC<DependenciesTableSectionProps> = ({
  dependencies,
  activeTab,
  setActiveTab,
}) => {
  return (
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
            Todos ({dependencies.web.length + dependencies.dashboard.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('web')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'web' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            Web Pública ({dependencies.web.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            Dashboard ({dependencies.dashboard.length})
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
              {(activeTab === 'all' || activeTab === 'web' ? dependencies.web.map((d: ComponentHealth) => ({ ...d, env: 'Web Pública' })) : [])
                .concat(activeTab === 'all' || activeTab === 'dashboard' ? dependencies.dashboard.map((d: ComponentHealth) => ({ ...d, env: 'Dashboard' })) : [])
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
                        <HealthSeverityBadge severity={item.severity} text={item.status_text} />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

