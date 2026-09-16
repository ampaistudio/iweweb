import React from 'react';
import type { PostSocialLink } from '../../api/types';

export interface SocialStatusBadgeProps {
  links?: PostSocialLink[];
  onRetry?: (platform: 'facebook' | 'instagram') => void;
  isRetrying?: boolean;
}

export const SocialStatusBadge: React.FC<SocialStatusBadgeProps> = ({
  links = [],
  onRetry,
  isRetrying = false,
}) => {
  if (!links || links.length === 0) {
    return <span className="text-xs text-stone-500 italic">Solo web</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const isSynced = link.sync_status === 'synced';
        const isFailed = link.sync_status === 'failed';
        const isPending = link.sync_status === 'pending';

        const platformName = link.platform === 'facebook' ? 'Facebook' : 'Instagram';
        const platformIcon = link.platform === 'facebook' ? '📘' : '📸';

        return (
          <div
            key={link.platform}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
              isSynced
                ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300'
                : isFailed
                ? 'bg-rose-950/70 border-rose-500/30 text-rose-300'
                : 'bg-amber-950/70 border-amber-500/30 text-amber-300'
            }`}
          >
            <span>{platformIcon}</span>
            <span>{platformName}:</span>
            <span className="font-bold">
              {isSynced && 'Sincronizado'}
              {isFailed && 'Falló'}
              {isPending && 'Pendiente'}
            </span>

            {isFailed && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(link.platform)}
                disabled={isRetrying}
                className="ml-1 underline hover:text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                title={link.sync_error || 'Reintentar sincronización con la red'}
              >
                {isRetrying ? '...' : 'Reintentar'}
              </button>
            )}

            {isSynced && link.external_permalink && (
              <a
                href={link.external_permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-0.5 opacity-70 hover:opacity-100"
                title="Ver post en la red"
              >
                ↗
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};
