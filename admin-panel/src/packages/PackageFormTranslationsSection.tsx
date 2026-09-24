import React from 'react';
import { Input } from '../core/ui/Input';
import { Textarea } from '../core/ui/Textarea';
import { AiTranslateButton } from '../core/ui/AiTranslateButton';
import type { PackageFormState, NonEsLocale } from './packageTypes';

export interface PackageFormTranslationsSectionProps {
  formData: PackageFormState;
  formLocale: NonEsLocale;
  setFormData: React.Dispatch<React.SetStateAction<PackageFormState>>;
}

export const PackageFormTranslationsSection: React.FC<PackageFormTranslationsSectionProps> = ({
  formData,
  formLocale,
  setFormData,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
        <span className="font-semibold text-primary block mb-1">Título base (ES):</span>
        <p className="italic font-medium">{formData.title || '(Sin título ingresado aún)'}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
            Título en {formLocale.toUpperCase()}
          </label>
          <AiTranslateButton
            sourceText={formData.title}
            targetLocale={formLocale}
            fieldName="Título del paquete"
            onTranslated={(val) =>
              setFormData((prev) => ({
                ...prev,
                translations: {
                  ...prev.translations,
                  [formLocale]: {
                    ...prev.translations[formLocale],
                    title: val,
                  },
                },
              }))
            }
          />
        </div>
        <Input
          value={formData.translations[formLocale]?.title || ''}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({
              ...prev,
              translations: {
                ...prev.translations,
                [formLocale]: {
                  ...prev.translations[formLocale],
                  title: val,
                },
              },
            }));
          }}
          placeholder={`Título traducido (${formLocale.toUpperCase()})...`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
            Descripción en {formLocale.toUpperCase()}
          </label>
          <AiTranslateButton
            sourceText={formData.description}
            targetLocale={formLocale}
            fieldName="Descripción del paquete"
            onTranslated={(val) =>
              setFormData((prev) => ({
                ...prev,
                translations: {
                  ...prev.translations,
                  [formLocale]: {
                    ...prev.translations[formLocale],
                    description: val,
                  },
                },
              }))
            }
          />
        </div>
        <Textarea
          rows={4}
          value={formData.translations[formLocale]?.description || ''}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({
              ...prev,
              translations: {
                ...prev.translations,
                [formLocale]: {
                  ...prev.translations[formLocale],
                  description: val,
                },
              },
            }));
          }}
          placeholder={`Descripción traducida (${formLocale.toUpperCase()})...`}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
          Unidad de Precio en {formLocale.toUpperCase()} (ej: per person / per persona)
        </label>
        <Input
          value={formData.translations[formLocale]?.price_unit || ''}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({
              ...prev,
              translations: {
                ...prev.translations,
                [formLocale]: {
                  ...prev.translations[formLocale],
                  price_unit: val,
                },
              },
            }));
          }}
          placeholder="per person / per persona / par personne"
        />
      </div>

      <Input
        label={`Título de introducción en ${formLocale.toUpperCase()}`}
        value={formData.translations[formLocale]?.intro_title || ''}
        onChange={(e) => setFormData((prev) => ({
          ...prev,
          translations: {
            ...prev.translations,
            [formLocale]: { ...prev.translations[formLocale], intro_title: e.target.value },
          },
        }))}
      />
      <Textarea
        label={`Introducción en ${formLocale.toUpperCase()}`}
        rows={4}
        value={formData.translations[formLocale]?.intro_text || ''}
        onChange={(e) => setFormData((prev) => ({
          ...prev,
          translations: {
            ...prev.translations,
            [formLocale]: { ...prev.translations[formLocale], intro_text: e.target.value },
          },
        }))}
      />
      <Textarea
        label={`Destacados en ${formLocale.toUpperCase()} (uno por línea)`}
        rows={4}
        value={(formData.translations[formLocale]?.highlights || []).join('\n')}
        onChange={(e) => setFormData((prev) => ({
          ...prev,
          translations: {
            ...prev.translations,
            [formLocale]: { ...prev.translations[formLocale], highlights: e.target.value.split('\n') },
          },
        }))}
      />
      <Textarea
        label={`Itinerario en ${formLocale.toUpperCase()} (una etapa por línea)`}
        rows={4}
        value={(formData.translations[formLocale]?.itinerary || []).join('\n')}
        onChange={(e) => setFormData((prev) => ({
          ...prev,
          translations: {
            ...prev.translations,
            [formLocale]: { ...prev.translations[formLocale], itinerary: e.target.value.split('\n') },
          },
        }))}
      />
    </div>
  );
};
