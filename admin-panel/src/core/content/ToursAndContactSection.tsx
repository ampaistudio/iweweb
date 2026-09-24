import React from 'react';
import type { DashboardLocale } from '../../api/types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { AiTranslateButton } from '../ui/AiTranslateButton';
import { SectionPublishToggle } from './SectionPublishToggle';
import type { NonEsLocale } from './contentTypes';

export interface ToursAndContactSectionProps {
  form: Record<string, string>;
  activeLocale: DashboardLocale;
  translations: Record<NonEsLocale, Record<string, string>>;
  onChange: (key: string, value: string) => void;
  onTranslationChange: (locale: NonEsLocale, key: string, value: string) => void;
}

export const ToursAndContactSection: React.FC<ToursAndContactSectionProps> = ({
  form,
  activeLocale,
  translations,
  onChange,
  onTranslationChange,
}) => {
  const isEs = activeLocale === 'es';
  const currentNonEs = !isEs ? (activeLocale as NonEsLocale) : null;

  return (
    <>
      {/* 5. Vacaciones completas con iWE (Tours y Paquetes) */}
      <Card
        title="Sección 'Vacaciones completas con iWE' (Tours y Paquetes)"
        subtitle={isEs ? 'Control de visibilidad y textos de la sección de paquetes en la Home' : `Traducción de Tours y Paquetes para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              {/* Toggle de publicación */}
              <SectionPublishToggle
                title="Publicar sección en la Home"
                activeDescription="La sección se muestra actualmente en la página principal."
                inactiveDescription="La sección está oculta en la página principal."
                checked={form.tours_section_published !== 'false' && form.tours_section_published !== '0'}
                onChange={(checked) => onChange('tours_section_published', checked ? 'true' : 'false')}
              />

              <Input
                label="Cintillo (Eyebrow)"
                value={form.tours_eyebrow || ''}
                onChange={(e) => onChange('tours_eyebrow', e.target.value)}
                placeholder="Tours en Andorra"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Título (Línea 1)"
                  value={form.tours_title_line1 || ''}
                  onChange={(e) => onChange('tours_title_line1', e.target.value)}
                  placeholder="Vacaciones"
                />
                <Input
                  label="Título (Línea 2 - Destacada)"
                  value={form.tours_title_line2 || ''}
                  onChange={(e) => onChange('tours_title_line2', e.target.value)}
                  placeholder="completas con iWE."
                />
              </div>
              <Textarea
                label="Texto descriptivo"
                rows={3}
                value={form.tours_copy || ''}
                onChange={(e) => onChange('tours_copy', e.target.value)}
                placeholder="Combina alojamiento, guías y actividades en un solo paquete..."
              />
              <Input
                label="Texto del botón CTA"
                value={form.tours_cta_text || ''}
                onChange={(e) => onChange('tours_cta_text', e.target.value)}
                placeholder="Consultar disponibilidad"
              />
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Cintillo en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.tours_eyebrow || ''}
                      targetLocale={activeLocale}
                      fieldName="Cintillo de Tours"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'tours_eyebrow', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].tours_eyebrow || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'tours_eyebrow', e.target.value)}
                    placeholder={`Traducción de cintillo (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título (Línea 1) en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.tours_title_line1 || ''}
                      targetLocale={activeLocale}
                      fieldName="Título Línea 1 de Tours"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'tours_title_line1', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].tours_title_line1 || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'tours_title_line1', e.target.value)}
                    placeholder={`Traducción de título línea 1 (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título (Línea 2) en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.tours_title_line2 || ''}
                      targetLocale={activeLocale}
                      fieldName="Título Línea 2 de Tours"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'tours_title_line2', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].tours_title_line2 || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'tours_title_line2', e.target.value)}
                    placeholder={`Traducción de título línea 2 (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Texto descriptivo en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.tours_copy || ''}
                      targetLocale={activeLocale}
                      fieldName="Descripción de Tours"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'tours_copy', val)}
                    />
                  </div>
                  <Textarea
                    rows={3}
                    value={translations[currentNonEs].tours_copy || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'tours_copy', e.target.value)}
                    placeholder={`Traducción de descripción (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Botón CTA en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.tours_cta_text || ''}
                      targetLocale={activeLocale}
                      fieldName="Botón CTA de Tours"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'tours_cta_text', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].tours_cta_text || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'tours_cta_text', e.target.value)}
                    placeholder={`Traducción de botón CTA (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* 6. Contacto & Newsletter */}
      <Card
        title="Sección Contacto y Newsletter"
        subtitle={isEs ? 'Textos de la llamada a la acción y datos de contacto oficiales' : `Traducción de Contacto para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              <Input
                label="Cintillo (Eyebrow)"
                value={form.contact_eyebrow || ''}
                onChange={(e) => onChange('contact_eyebrow', e.target.value)}
                placeholder="Mantente inspirado"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Título (Línea 1)"
                  value={form.contact_title_line1 || ''}
                  onChange={(e) => onChange('contact_title_line1', e.target.value)}
                  placeholder="Más montaña."
                />
                <Input
                  label="Título (Línea 2)"
                  value={form.contact_title_line2 || ''}
                  onChange={(e) => onChange('contact_title_line2', e.target.value)}
                  placeholder="Menos rutina."
                />
              </div>
              <Textarea
                label="Texto de suscripción / contacto"
                rows={3}
                value={form.contact_copy || ''}
                onChange={(e) => onChange('contact_copy', e.target.value)}
                placeholder="Recibe novedades, disponibilidad de actividades..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Teléfono de contacto (WhatsApp)"
                  value={form.contact_phone || ''}
                  onChange={(e) => onChange('contact_phone', e.target.value)}
                  placeholder="+00 000 000"
                />
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={form.contact_email || ''}
                  onChange={(e) => onChange('contact_email', e.target.value)}
                  placeholder="info@empresa.com"
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Dirección física"
                    value={form.contact_address || ''}
                    onChange={(e) => onChange('contact_address', e.target.value)}
                    placeholder="Av. de Sant Antoni, 12, AD400 La Massana, Andorra"
                  />
                </div>
              </div>
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Texto de Contacto en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.contact_copy || ''}
                      targetLocale={activeLocale}
                      fieldName="Texto de Contacto"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'contact_copy', val)}
                    />
                  </div>
                  <Textarea
                    rows={3}
                    value={translations[currentNonEs].contact_copy || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'contact_copy', e.target.value)}
                    placeholder={`Traducción de texto de contacto (${activeLocale.toUpperCase()})...`}
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
