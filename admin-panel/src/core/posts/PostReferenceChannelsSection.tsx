import React from 'react';
import { Badge } from '../ui/Badge';
import type { SocialNetworkItem } from '../content/SocialLinksSection';

export interface PostReferenceChannelsSectionProps {
  socialNetworks: SocialNetworkItem[];
  selectedRefChannels: string[];
  isContentLoading: boolean;
  onToggleChannel: (id: string, checked: boolean) => void;
}

export const PostReferenceChannelsSection: React.FC<PostReferenceChannelsSectionProps> = ({
  socialNetworks,
  selectedRefChannels,
  isContentLoading,
  onToggleChannel,
}) => {
  return (
    <div className="mt-4 p-4 bg-surface-elevated/40 border border-border rounded-xl space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary">📢 Canales de Difusión Adicionales</span>
          <Badge variant="neutral" size="sm">Enlaces de Referencia</Badge>
        </div>
        {socialNetworks.length > 0 && (
          <span className="text-[11px] text-muted font-mono">
            {selectedRefChannels.length} de {socialNetworks.length} seleccionados
          </span>
        )}
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Selecciona las redes de difusión donde deseas compartir el enlace de este post tras publicarlo.
      </p>

      {isContentLoading ? (
        <p className="text-xs text-muted py-2">Cargando canales de difusión...</p>
      ) : socialNetworks.length === 0 ? (
        <div className="p-3 bg-surface border border-dashed border-border rounded-lg text-xs text-muted text-center">
          No hay canales de difusión configurados. Agrégalos desde Contenido → Redes Sociales.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {socialNetworks.map((net) => {
            const isSelected = selectedRefChannels.includes(net.id);
            const isIconUrl = net.icon?.startsWith('http://') || net.icon?.startsWith('https://') || net.icon?.startsWith('/');

            return (
              <label
                key={net.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-surface border-accent/60 ring-1 ring-accent/20'
                    : 'bg-surface/50 border-border opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onToggleChannel(net.id, e.target.checked)}
                  className="w-4 h-4 rounded text-accent focus:ring-accent bg-surface border-border-strong"
                />
                <div className="w-6 h-6 rounded-md bg-surface-elevated border border-border flex items-center justify-center shrink-0 overflow-hidden text-xs">
                  {isIconUrl ? (
                    <img src={net.icon} alt={net.name} className="w-4 h-4 object-contain" />
                  ) : (
                    <span>{net.icon || '🌐'}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-primary block truncate">{net.name}</span>
                  <span className="text-[10px] text-muted truncate block" title={net.url}>
                    {net.url || 'Sin URL configurada'}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

