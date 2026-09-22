import React from 'react';
import type { DashboardLocale } from '../../api/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { AiTranslateButton } from '../ui/AiTranslateButton';
import { GoogleSerpPreview } from './GoogleSerpPreview';
import { SocialCardPreview } from './SocialCardPreview';
import type { NonEsLocale, PickerTarget } from './contentTypes';

export interface SeoSocialSectionProps {
  form: Record<string, string>;
  activeLocale: DashboardLocale;
  translations: Record<NonEsLocale, Record<string, string>>;
  onChange: (key: string, value: string) => void;
  onTranslationChange: (locale: NonEsLocale, key: string, value: string) => void;
  onOpenPicker: (target: PickerTarget) => void;
}

export const SeoSocialSection: React.FC<SeoSocialSectionProps> = ({
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
    <Card
      title="Posicionamiento SEO & Previsualización Social (Google / WhatsApp)"
      subtitle={
        isEs
          ? 'Personaliza cómo se muestra iWE en Google y al compartir enlaces por WhatsApp'
          : `Traducción de Metadatos SEO para ${activeLocale.toUpperCase()}`
      }
    >
      <div className="space-y-6">
        {isEs ? (
          <>
            <div className="space-y-4">
              <Input
                label="Título SEO para Google y Navegador (Recomendado: 50-60 caracteres)"
                value={form.seo_meta_title || ''}
                onChange={(e) => onChange('seo_meta_title', e.target.value)}
                placeholder="iWE | Isard Wildland Experience — Turismo Activo y Aventura en Andorra"
              />
              <div className="text-right text-[11px] text-muted">
                {(form.seo_meta_title || '').length} caracteres
              </div>

              <Textarea
                label="Meta Descripción para Buscadores (Recomendado: 120-160 caracteres)"
                rows={3}
                value={form.seo_meta_description || ''}
                onChange={(e) => onChange('seo_meta_description', e.target.value)}
                placeholder="Descubre experiencias únicas en Andorra y los Pirineos con guías locales certificados..."
              />
              <div className="text-right text-[11px] text-muted">
                {(form.seo_meta_description || '').length} caracteres
              </div>

              <Input
                label="Palabras Clave (Keywords separadas por coma)"
                value={form.seo_keywords || ''}
                onChange={(e) => onChange('seo_keywords', e.target.value)}
                placeholder="Andorra, iWE, BTT, E-Bike Enduro, 4x4, Vía Ferrata, Senderismo, Esquí Tour"
              />

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Imagen de Portada para WhatsApp / Facebook / Twitter (OpenGraph)
                </label>
                {form.seo_og_image ? (
                  <div className="rounded-xl border border-border bg-bg p-3 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={form.seo_og_image}
                      alt="SEO OpenGraph Preview"
                      className="w-full sm:w-36 h-20 rounded-lg object-cover bg-surface-elevated border border-border flex-shrink-0"
                    />
                    <div className="flex-1 space-y-1.5 w-full text-left">
                      <p className="text-xs font-semibold text-primary">Imagen seleccionada para compartir</p>
                      <p className="text-[11px] text-muted break-all">{form.seo_og_image}</p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenPicker('og_image')}
                        >
                          Cambiar imagen
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onChange('seo_og_image', '')}
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
                    onClick={() => onOpenPicker('og_image')}
                  >
                    🖼️ Elegir imagen de portada para compartir en redes
                  </Button>
                )}
              </div>
            </div>

            {/* Vistas previas en vivo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-border">
              <GoogleSerpPreview
                siteUrl={form.site_url}
                metaTitle={form.seo_meta_title}
                metaDescription={form.seo_meta_description}
              />

              <SocialCardPreview
                ogImage={form.seo_og_image}
                metaTitle={form.seo_meta_title}
                metaDescription={form.seo_meta_description}
              />
            </div>
          </>
        ) : (
          currentNonEs && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                    Título SEO en {activeLocale.toUpperCase()}
                  </label>
                  <AiTranslateButton
                    sourceText={form.seo_meta_title || ''}
                    targetLocale={activeLocale}
                    fieldName="Título SEO"
                    onTranslated={(val) => onTranslationChange(currentNonEs, 'seo_meta_title', val)}
                  />
                </div>
                <Input
                  value={translations[currentNonEs].seo_meta_title || ''}
                  onChange={(e) => onTranslationChange(currentNonEs, 'seo_meta_title', e.target.value)}
                  placeholder={`Traducción de Título SEO (${activeLocale.toUpperCase()})...`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                    Meta Descripción en {activeLocale.toUpperCase()}
                  </label>
                  <AiTranslateButton
                    sourceText={form.seo_meta_description || ''}
                    targetLocale={activeLocale}
                    fieldName="Meta Descripción"
                    onTranslated={(val) => onTranslationChange(currentNonEs, 'seo_meta_description', val)}
                  />
                </div>
                <Textarea
                  rows={3}
                  value={translations[currentNonEs].seo_meta_description || ''}
                  onChange={(e) => onTranslationChange(currentNonEs, 'seo_meta_description', e.target.value)}
                  placeholder={`Traducción de Meta Descripción (${activeLocale.toUpperCase()})...`}
                />
              </div>
            </div>
          )
        )}
      </div>
    </Card>
  );
};

