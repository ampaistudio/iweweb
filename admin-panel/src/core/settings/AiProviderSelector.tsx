import React from 'react';
import type { AiTranslationProvider } from '../../api/types';
import { Card } from '../ui/Card';

export const AI_PROVIDERS: Array<{
  id: AiTranslationProvider;
  name: string;
  badge: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'nvidia_nim',
    name: 'NVIDIA NIM',
    badge: 'Predeterminado / Gratuito',
    description: 'Llama-3.1 70B Instruct en la nube de NVIDIA. Alta fidelidad turística.',
    icon: '🟢',
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    badge: 'GPT-4o mini / GPT-4o',
    description: 'Modelos de OpenAI con alta velocidad y consistencia multilingüe.',
    icon: '⚡',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Gemini 1.5 Flash / Pro',
    description: 'API de Google AI Studio con ventana amplia y respuesta inmediata.',
    icon: '✨',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude 3.5 Haiku',
    description: 'Redacción y tono con máxima naturalidad y matiz en catalán y francés.',
    icon: '🟣',
  },
];

interface AiProviderSelectorProps {
  activeProvider: string;
  switchingProvider: boolean;
  onSelectProvider: (providerId: AiTranslationProvider) => void;
}

export const AiProviderSelector: React.FC<AiProviderSelectorProps> = ({
  activeProvider,
  switchingProvider,
  onSelectProvider,
}) => {
  return (
    <Card
      title="🤖 Motor de Traducción con Inteligencia Artificial"
      subtitle="Elige qué proveedor de IA procesará las traducciones automáticas al catalán, inglés y francés en las actividades y textos del CMS."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {AI_PROVIDERS.map((prov) => {
            const isSelected = activeProvider === prov.id;
            return (
              <button
                key={prov.id}
                type="button"
                disabled={switchingProvider}
                onClick={() => onSelectProvider(prov.id)}
                className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                    : 'border-border bg-bg/50 hover:bg-surface-elevated hover:border-border-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xl">{prov.icon}</span>
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent-contrast">
                      ACTIVO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-elevated border border-border text-muted">
                      Seleccionar
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                    {prov.name}
                  </h4>
                  <p className="text-[11px] text-muted line-clamp-2 mt-0.5">
                    {prov.description}
                  </p>
                </div>

                <span className="text-[10px] font-semibold text-secondary opacity-80">
                  {prov.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-surface-elevated/60 border border-border text-xs text-muted flex items-center justify-between gap-2">
          <span>
            ℹ️ Motor activo actual:{' '}
            <strong className="text-primary font-mono uppercase">{activeProvider}</strong>. Asegúrate de configurar su API key debajo.
          </span>
        </div>
      </div>
    </Card>
  );
};

