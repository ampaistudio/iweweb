import React, { useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { DashboardLocale } from '../../api/types';
import { useToast } from './ToastContext';

export interface AiTranslateButtonProps {
  sourceText: string;
  targetLocale: DashboardLocale;
  fieldName?: string;
  onTranslated: (translatedText: string) => void;
  size?: 'xs' | 'sm';
  className?: string;
}

export const AiTranslateButton: React.FC<AiTranslateButtonProps> = ({
  sourceText,
  targetLocale,
  fieldName = 'campo',
  onTranslated,
  size = 'xs',
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (targetLocale === 'es') {
    return null;
  }

  const handleTranslate = async () => {
    if (!sourceText || !sourceText.trim()) {
      toast.warning('Primero debes ingresar el texto en Español para traducirlo.', 'Texto base vacío');
      return;
    }

    setLoading(true);
    try {
      const res = await api.translate({
        text: sourceText.trim(),
        target_locale: targetLocale as 'ca' | 'en' | 'fr',
        source_locale: 'es',
        field_name: fieldName,
      });

      if (res?.translated_text) {
        onTranslated(res.translated_text);
        toast.success(`Traducción generada para ${fieldName}. Revisa el texto y guarda los cambios cuando estés listo.`, 'Traducción con IA');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 503) {
        toast.error('Traducción por IA no configurada en el servidor (falta NVIDIA_NIM_API_KEY). Puedes ingresar la traducción manualmente.', 'Servicio no disponible');
      } else {
        const msg = err instanceof Error ? err.message : 'Error al conectar con la IA de traducción';
        toast.error(msg, 'Error de traducción');
      }
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === 'xs'
    ? 'px-2 py-1 text-[11px]'
    : 'px-3 py-1.5 text-xs';

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading || !sourceText.trim()}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors cursor-pointer bg-accent-soft text-accent-text hover:bg-accent/20 border border-accent/30 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
      title="Sugerir traducción con IA (NVIDIA NIM) a partir del texto en Español"
    >
      {loading ? (
        <>
          <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block" />
          <span>Traduciendo...</span>
        </>
      ) : (
        <>
          <span>✨</span>
          <span>Traducir con IA</span>
        </>
      )}
    </button>
  );
};

