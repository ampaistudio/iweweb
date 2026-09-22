import React from 'react';
import { api } from '../../api/client';
import type { BackupItem } from '../../api/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface BackupsManagerSectionProps {
  backups: BackupItem[];
  creatingBackup: boolean;
  onCreateBackup: () => void;
}

export const BackupsManagerSection: React.FC<BackupsManagerSectionProps> = ({
  backups,
  creatingBackup,
  onCreateBackup,
}) => {
  return (
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
          onClick={onCreateBackup}
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
  );
};

