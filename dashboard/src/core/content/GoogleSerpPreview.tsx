import React from 'react';
import { DEFAULT_KEYS } from './contentTypes';

export interface GoogleSerpPreviewProps {
  siteUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export const GoogleSerpPreview: React.FC<GoogleSerpPreviewProps> = ({
  siteUrl,
  metaTitle,
  metaDescription,
}) => {
  return (
    <div className="p-4 rounded-xl bg-bg border border-border space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-secondary uppercase tracking-wider">
          🔍 Vista Previa en Google Search
        </span>
      </div>
      <div className="space-y-1 bg-white dark:bg-[#202124] p-3 rounded-lg border border-border/50 text-left">
        <div className="text-[12px] text-[#202124] dark:text-[#bdc1c6] flex items-center gap-1.5 font-sans">
          <span className="w-4 h-4 rounded-full bg-[#1a73e8] text-white text-[9px] flex items-center justify-center font-bold">
            i
          </span>
          <span className="truncate">{siteUrl || DEFAULT_KEYS.site_url}</span>
        </div>
        <div className="text-[16px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug line-clamp-1">
          {metaTitle || 'iWE | Isard Wildland Experience — Turismo Activo y Aventura en Andorra'}
        </div>
        <div className="text-[12px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
          {metaDescription ||
            'Descubre experiencias únicas en Andorra y los Pirineos con guías locales certificados: BTT, E-Bike Enduro, Vía Ferrata, 4x4, Senderismo, Esquí Tour y Raquetas de Nieve.'}
        </div>
      </div>
    </div>
  );
};

