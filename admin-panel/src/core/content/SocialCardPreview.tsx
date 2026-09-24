import React from 'react';

export interface SocialCardPreviewProps {
  ogImage?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export const SocialCardPreview: React.FC<SocialCardPreviewProps> = ({
  ogImage,
  metaTitle,
  metaDescription,
}) => {
  return (
    <div className="p-4 rounded-xl bg-bg border border-border space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-secondary uppercase tracking-wider">
          💬 Vista Previa en WhatsApp / Redes
        </span>
      </div>
      <div className="bg-[#e9fed8] dark:bg-[#054740] p-2.5 rounded-lg border border-[#c7e8b4] dark:border-[#075e54] text-left max-w-sm">
        <div className="rounded-lg overflow-hidden bg-surface border border-border">
          {ogImage ? (
            <img src={ogImage} alt="Preview" className="w-full h-32 object-cover" />
          ) : (
            <div className="w-full h-24 bg-surface-elevated flex items-center justify-center text-xs text-muted">
              Sin imagen asignada (se usará la de portada general)
            </div>
          )}
          <div className="p-2.5 space-y-1">
            <span className="text-[10px] text-muted uppercase tracking-wider">Dominio configurado</span>
            <p className="text-xs font-bold text-primary line-clamp-1">
              {metaTitle || 'Título sin configurar'}
            </p>
            <p className="text-[11px] text-secondary line-clamp-2 leading-tight">
              {metaDescription || 'Descripción sin configurar'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
