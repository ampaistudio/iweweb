import React from 'react';
import { Card } from '../core/ui/Card';
import { Input } from '../core/ui/Input';
import { RichTextEditor } from '../core/ui/RichTextEditor';
import { AiTranslateButton } from '../core/ui/AiTranslateButton';
import type { DashboardLocale } from '../api/types';

type NonEsLocale = 'ca' | 'en' | 'fr';

export interface LocaleActivityData {
  title: string;
  description: string;
  intro_title: string;
  intro_text: string;
  region: string;
  country: string;
  level: string;
  duration: string;
  alt_text: string;
  highlights: string[];
}

interface ActivityTranslationsSectionProps {
  activeLocale: DashboardLocale;
  translations: Record<NonEsLocale, LocaleActivityData>;
  baseTitle: string;
  baseRegion: string;
  baseCountry: string;
  baseLevel: string;
  baseDuration: string;
  baseAltText: string;
  baseIntroTitle: string;
  baseIntroText: string;
  baseDescription: string;
  baseHighlights: string[];
  onUpdateTranslationField: (
    locale: NonEsLocale,
    field: 'title' | 'description' | 'intro_title' | 'intro_text' | 'region' | 'country' | 'level' | 'duration' | 'alt_text',
    val: string
  ) => void;
  onUpdateTranslationHighlight: (locale: NonEsLocale, index: number, val: string) => void;
}

export const ActivityTranslationsSection: React.FC<ActivityTranslationsSectionProps> = ({
  activeLocale,
  translations,
  baseTitle,
  baseRegion,
  baseCountry,
  baseLevel,
  baseDuration,
  baseAltText,
  baseIntroTitle,
  baseIntroText,
  baseDescription,
  baseHighlights,
  onUpdateTranslationField,
  onUpdateTranslationHighlight,
}) => {
  if (activeLocale === 'es') return null;
  const currentNonEs = activeLocale as NonEsLocale;

  return (
    <>
      {/* 1. Información Principal en Idioma No-ES */}
      <Card
        title="Información Principal"
        subtitle={`Traducción de título para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
            <span className="font-semibold text-primary block mb-1">Título base en Español:</span>
            <p className="italic">{baseTitle || '(Sin título ingresado aún)'}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                Título en {activeLocale.toUpperCase()}
              </label>
              <AiTranslateButton
                sourceText={baseTitle}
                targetLocale={activeLocale}
                fieldName="Título de la actividad"
                onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'title', val)}
              />
            </div>
            <Input
              value={translations[currentNonEs].title}
              onChange={(e) => onUpdateTranslationField(currentNonEs, 'title', e.target.value)}
              placeholder={`Título traducido (${activeLocale.toUpperCase()})...`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                  Región / Zona ({activeLocale.toUpperCase()})
                </label>
                {baseRegion && (
                  <AiTranslateButton
                    sourceText={baseRegion}
                    targetLocale={activeLocale}
                    fieldName="Región / Zona"
                    onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'region', val)}
                  />
                )}
              </div>
              <Input
                value={translations[currentNonEs].region}
                onChange={(e) => onUpdateTranslationField(currentNonEs, 'region', e.target.value)}
                placeholder={baseRegion || `Región traducida (${activeLocale.toUpperCase()})...`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                  País ({activeLocale.toUpperCase()})
                </label>
                {baseCountry && (
                  <AiTranslateButton
                    sourceText={baseCountry}
                    targetLocale={activeLocale}
                    fieldName="País"
                    onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'country', val)}
                  />
                )}
              </div>
              <Input
                value={translations[currentNonEs].country}
                onChange={(e) => onUpdateTranslationField(currentNonEs, 'country', e.target.value)}
                placeholder={baseCountry || `País traducido (${activeLocale.toUpperCase()})...`}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Detalles del Recorrido */}
      <Card
        title="Detalles del Recorrido"
        subtitle={`Nivel y duración traducidos para ${activeLocale.toUpperCase()} (el precio es compartido)`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                Nivel / Dificultad ({activeLocale.toUpperCase()})
              </label>
              {baseLevel && (
                <AiTranslateButton
                  sourceText={baseLevel}
                  targetLocale={activeLocale}
                  fieldName="Nivel / Dificultad"
                  onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'level', val)}
                />
              )}
            </div>
            <Input
              value={translations[currentNonEs].level}
              onChange={(e) => onUpdateTranslationField(currentNonEs, 'level', e.target.value)}
              placeholder={baseLevel || `Nivel (${activeLocale.toUpperCase()})...`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                Duración ({activeLocale.toUpperCase()})
              </label>
              {baseDuration && (
                <AiTranslateButton
                  sourceText={baseDuration}
                  targetLocale={activeLocale}
                  fieldName="Duración"
                  onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'duration', val)}
                />
              )}
            </div>
            <Input
              value={translations[currentNonEs].duration}
              onChange={(e) => onUpdateTranslationField(currentNonEs, 'duration', e.target.value)}
              placeholder={baseDuration || `Duración (${activeLocale.toUpperCase()})...`}
            />
          </div>
        </div>
      </Card>

      {/* 3. Texto Alternativo de Foto */}
      <Card
        title="Texto Alternativo de Foto (Accesibilidad & SEO)"
        subtitle={`Descripción de la foto principal en ${activeLocale.toUpperCase()} para buscadores y lectores de pantalla`}
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
              Texto alternativo (Alt text) en {activeLocale.toUpperCase()}
            </label>
            {baseAltText && (
              <AiTranslateButton
                sourceText={baseAltText}
                targetLocale={activeLocale}
                fieldName="Texto alternativo de foto"
                onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'alt_text', val)}
              />
            )}
          </div>
          <Input
            value={translations[currentNonEs].alt_text}
            onChange={(e) => onUpdateTranslationField(currentNonEs, 'alt_text', e.target.value)}
            placeholder={baseAltText || `Texto alternativo (${activeLocale.toUpperCase()})...`}
            helperText="Traducción del atributo alt para SEO y accesibilidad en este idioma."
          />
        </div>
      </Card>

      {/* 4. Descripción y Puntos Destacados */}
      <Card
        title="Descripción y Puntos Destacados"
        subtitle={`Traducción de textos para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-6">
          <div className="space-y-3 pb-5 border-b border-border">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                  Título de introducción en {activeLocale.toUpperCase()}
                </label>
                {baseIntroTitle && (
                  <AiTranslateButton
                    sourceText={baseIntroTitle}
                    targetLocale={activeLocale}
                    fieldName="Título de introducción"
                    onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'intro_title', val)}
                  />
                )}
              </div>
              <input
                type="text"
                value={translations[currentNonEs].intro_title}
                onChange={(e) => onUpdateTranslationField(currentNonEs, 'intro_title', e.target.value)}
                placeholder={`Título de introducción traducido (${activeLocale.toUpperCase()})...`}
                className="w-full bg-input border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3.5 py-2 text-sm text-primary placeholder-faint focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                  Texto de introducción en {activeLocale.toUpperCase()}
                </label>
                {baseIntroText && (
                  <AiTranslateButton
                    sourceText={baseIntroText}
                    targetLocale={activeLocale}
                    fieldName="Texto de introducción"
                    onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'intro_text', val)}
                  />
                )}
              </div>
              <RichTextEditor
                value={translations[currentNonEs].intro_text}
                onChange={(val) => onUpdateTranslationField(currentNonEs, 'intro_text', val)}
                placeholder={`Texto de introducción traducido (${activeLocale.toUpperCase()})...`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
              <span className="font-semibold text-primary block mb-1">Descripción base en Español:</span>
              {baseDescription ? (
                <div className="rich-text-content leading-relaxed" dangerouslySetInnerHTML={{ __html: baseDescription }} />
              ) : (
                <p className="leading-relaxed">(Sin descripción ingresada aún)</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                  Descripción en {activeLocale.toUpperCase()}
                </label>
                <AiTranslateButton
                  sourceText={baseDescription}
                  targetLocale={activeLocale}
                  fieldName="Descripción completa"
                  onTranslated={(val) => onUpdateTranslationField(currentNonEs, 'description', val)}
                />
              </div>
              <RichTextEditor
                value={translations[currentNonEs].description}
                onChange={(val) => onUpdateTranslationField(currentNonEs, 'description', val)}
                placeholder={`Descripción traducida (${activeLocale.toUpperCase()})...`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              Puntos destacados / Qué incluye ({activeLocale.toUpperCase()})
            </label>
            <div className="space-y-4">
              {baseHighlights.map((baseH, index) => (
                <div key={index} className="p-3 bg-bg rounded-xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-secondary">
                      Punto #{index + 1} ({activeLocale.toUpperCase()})
                    </span>
                    {baseH && (
                      <AiTranslateButton
                        sourceText={baseH}
                        targetLocale={activeLocale}
                        fieldName={`Punto destacado #${index + 1}`}
                        onTranslated={(val) => onUpdateTranslationHighlight(currentNonEs, index, val)}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted italic">Base (ES): {baseH || '(vacío)'}</p>
                  <input
                    type="text"
                    value={translations[currentNonEs].highlights?.[index] || ''}
                    onChange={(e) => onUpdateTranslationHighlight(currentNonEs, index, e.target.value)}
                    placeholder={`Traducción del punto #${index + 1}...`}
                    className="w-full bg-input border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3.5 py-2 text-sm text-primary placeholder-faint focus:outline-none focus:ring-2"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

