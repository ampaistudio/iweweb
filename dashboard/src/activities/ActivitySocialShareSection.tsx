import React from 'react';
import { Card } from '../core/ui/Card';
import { Toggle } from '../core/ui/Toggle';
import { Button } from '../core/ui/Button';
import type { ActivitySocialLink } from './types';

interface ActivitySocialShareSectionProps {
  isEdit: boolean;
  publishToFacebook: boolean;
  setPublishToFacebook: (val: boolean) => void;
  publishToInstagram: boolean;
  setPublishToInstagram: (val: boolean) => void;
  socialLinks: ActivitySocialLink[];
  isSharingSocial: boolean;
  onManualSocialShare: () => void;
}

export const ActivitySocialShareSection: React.FC<ActivitySocialShareSectionProps> = ({
  isEdit,
  publishToFacebook,
  setPublishToFacebook,
  publishToInstagram,
  setPublishToInstagram,
  socialLinks,
  isSharingSocial,
  onManualSocialShare,
}) => {
  return (
    <Card
      title="📲 Difusión en Redes Sociales (Meta / Instagram)"
      subtitle="Publica automáticamente esta actividad en la página oficial de Facebook y en la cuenta de Instagram de iWE."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-bg/40 space-y-2">
            <Toggle
              label="📘 Publicar en Facebook Page"
              description="Crea un post con la foto principal, descripción y enlace directo al tour."
              checked={publishToFacebook}
              onChange={setPublishToFacebook}
            />
          </div>

          <div className="p-4 rounded-xl border border-border bg-bg/40 space-y-2">
            <Toggle
              label="📷 Publicar en Instagram"
              description="Publica la imagen y el resumen en el feed de Instagram Business."
              checked={publishToInstagram}
              onChange={setPublishToInstagram}
            />
          </div>
        </div>

        {/* Social Links Status */}
        {socialLinks.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-secondary">Historial de Sincronización Social:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {socialLinks.map((link) => (
                <div
                  key={link.platform}
                  className="p-3 rounded-lg bg-surface-elevated border border-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{link.platform === 'facebook' ? '📘 Facebook' : '📷 Instagram'}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        link.sync_status === 'synced'
                          ? 'bg-success/15 text-success'
                          : link.sync_status === 'failed'
                          ? 'bg-danger/15 text-danger'
                          : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {link.sync_status === 'synced' ? 'Publicado' : link.sync_status === 'failed' ? 'Error' : 'Pendiente'}
                    </span>
                  </div>

                  {link.external_permalink && (
                    <a
                      href={link.external_permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline font-medium"
                    >
                      Ver post ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Share Action when editing existing activity */}
        {isEdit && (publishToFacebook || publishToInstagram) && (
          <div className="flex items-center justify-between pt-2 border-t border-border bg-surface-elevated/40 p-3 rounded-xl">
            <span className="text-xs text-muted">
              ¿Deseas compartir ahora mismo sin esperar a guardar toda la actividad?
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isSharingSocial}
              onClick={onManualSocialShare}
            >
              🚀 Compartir en redes sociales ahora
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

