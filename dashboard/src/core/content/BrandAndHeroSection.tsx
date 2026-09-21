import React from 'react';
import type { DashboardLocale } from '../../api/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { AiTranslateButton } from '../ui/AiTranslateButton';
import type { NonEsLocale, PickerTarget } from './contentTypes';

export interface BrandAndHeroSectionProps {
  form: Record<string, string>;
  activeLocale: DashboardLocale;
  translations: Record<NonEsLocale, Record<string, string>>;
  onChange: (key: string, value: string) => void;
  onTranslationChange: (locale: NonEsLocale, key: string, value: string) => void;
  onOpenPicker: (target: PickerTarget) => void;
}

export const BrandAndHeroSection: React.FC<BrandAndHeroSectionProps> = ({
  form,
  activeLocale,
  translations,
  onChange,
  onTranslationChange,
  onOpenPicker,
}) => {
  const isEs = activeLocale === 'es';
  const currentNonEs = !isEs ? (activeLocale as NonEsLocale) : null;

  return (
    <>
      {/* 1. Identidad de Marca y Logo */}
      <Card
        title="Identidad de Marca y Logo"
        subtitle={isEs ? 'Logo, tamaño en encabezado y nombre comercial de iWE' : 'Ajustes de marca compartidos'}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Logo de la empresa</label>
                {form.logo_url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-bg p-4 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={form.logo_url}
                      alt="Logo de iWE"
                      className="w-full sm:w-40 h-20 rounded-xl object-contain bg-surface-elevated border border-border flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2 w-full text-left">
                      <p className="text-xs font-semibold text-primary">Logo asignado</p>
                      <p className="text-[11px] text-muted break-all">{form.logo_url}</p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenPicker('logo')}
                        >
                          Cambiar logo
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onChange('logo_url', '')}
                          className="text-danger-text hover:text-danger"
                        >
                          Quitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => onOpenPicker('logo')}
                  >
                    Seleccionar logo
                  </Button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-secondary">
                    Altura del Logo en el Header: <span className="font-bold text-accent font-mono">{form.logo_height || '44'}px</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange('logo_height', '44')}
                    className="text-[11px] text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    Restablecer (44px)
                  </button>
                </div>
                <input
                  type="range"
                  min="24"
                  max="120"
                  step="2"
                  value={form.logo_height || '44'}
                  onChange={(e) => onChange('logo_height', e.target.value)}
                  className="w-full accent-accent cursor-pointer h-2 bg-surface-elevated rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1 font-mono">
                  <span>24px (compacto)</span>
                  <span>44px (estándar)</span>
                  <span>72px (grande)</span>
                  <span>120px (máximo)</span>
                </div>
              </div>

              <Input
                label="Nombre del negocio (compartido)"
                value={form.business_name || ''}
                onChange={(e) => onChange('business_name', e.target.value)}
                placeholder="Isard Wildland Experience"
              />
            </>
          ) : (
            <p className="text-sm text-muted">Los ajustes de logotipo e identidad comercial son compartidos globalmente.</p>
          )}
        </div>
      </Card>

      {/* 2. Hero Principal (Inicio) */}
      <Card
        title="Hero Principal (Encabezado de Inicio)"
        subtitle={isEs ? 'Títulos y textos de bienvenida mostrados sobre el carrusel de inicio' : `Traducción del Hero para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              <Input
                label="Cintillo superior (Eyebrow)"
                value={form.hero_eyebrow || ''}
                onChange={(e) => onChange('hero_eyebrow', e.target.value)}
                placeholder="Elige tu experiencia con nosotros"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Título principal (Línea 1)"
                  value={form.hero_title_line1 || ''}
                  onChange={(e) => onChange('hero_title_line1', e.target.value)}
                  placeholder="Todas las experiencias."
                />
                <Input
                  label="Título principal (Línea 2 - Destacado)"
                  value={form.hero_title_line2 || ''}
                  onChange={(e) => onChange('hero_title_line2', e.target.value)}
                  placeholder="Un solo operador."
                />
              </div>
              <Textarea
                label="Texto descriptivo del Hero (Copy)"
                rows={3}
                value={form.hero_copy || ''}
                onChange={(e) => onChange('hero_copy', e.target.value)}
                placeholder="iWE, la agencia líder en turismo de experiencias..."
              />
              <Input
                label="Frase de pie de foto (Hero Tagline)"
                value={form.hero_tagline || ''}
                onChange={(e) => onChange('hero_tagline', e.target.value)}
                placeholder="Fabricamos experiencias."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Botón CTA: Ver actividades"
                  value={form.hero_cta_activities || ''}
                  onChange={(e) => onChange('hero_cta_activities', e.target.value)}
                  placeholder="Ver actividades"
                />
                <Input
                  label="Botón CTA: Reservar ahora"
                  value={form.hero_cta_reserve || ''}
                  onChange={(e) => onChange('hero_cta_reserve', e.target.value)}
                  placeholder="Reservar ahora"
                />
              </div>
              <Input
                label="Texto del scroll hint (debajo del Hero)"
                value={form.hero_scroll_hint || ''}
                onChange={(e) => onChange('hero_scroll_hint', e.target.value)}
                placeholder="Descubre más"
              />
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Cintillo (Eyebrow) en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.hero_eyebrow || ''}
                      targetLocale={activeLocale}
                      fieldName="Cintillo del Hero"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'hero_eyebrow', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].hero_eyebrow || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'hero_eyebrow', e.target.value)}
                    placeholder={`Traducción de cintillo (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título (Línea 1) en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.hero_title_line1 || ''}
                      targetLocale={activeLocale}
                      fieldName="Título Línea 1"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'hero_title_line1', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].hero_title_line1 || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'hero_title_line1', e.target.value)}
                    placeholder={`Traducción de título línea 1 (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título (Línea 2) en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.hero_title_line2 || ''}
                      targetLocale={activeLocale}
                      fieldName="Título Línea 2"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'hero_title_line2', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].hero_title_line2 || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'hero_title_line2', e.target.value)}
                    placeholder={`Traducción de título línea 2 (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Texto descriptivo (Copy) en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.hero_copy || ''}
                      targetLocale={activeLocale}
                      fieldName="Texto descriptivo del Hero"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'hero_copy', val)}
                    />
                  </div>
                  <Textarea
                    rows={3}
                    value={translations[currentNonEs].hero_copy || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'hero_copy', e.target.value)}
                    placeholder={`Traducción de texto descriptivo (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>
    </>
  );
};

