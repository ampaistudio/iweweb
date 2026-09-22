import React from 'react';
import type { DashboardLocale } from '../../api/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { AiTranslateButton } from '../ui/AiTranslateButton';
import type { NonEsLocale, PickerTarget } from './contentTypes';

export interface CompanyAndTeamSectionProps {
  form: Record<string, string>;
  activeLocale: DashboardLocale;
  translations: Record<NonEsLocale, Record<string, string>>;
  onChange: (key: string, value: string) => void;
  onTranslationChange: (locale: NonEsLocale, key: string, value: string) => void;
  onOpenPicker: (target: PickerTarget) => void;
}

export const CompanyAndTeamSection: React.FC<CompanyAndTeamSectionProps> = ({
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
      {/* 3. Sobre Nosotros / Misión */}
      <Card
        title="Sección 'Sobre Nosotros' (Misión y Empresa)"
        subtitle={isEs ? 'Textos de la sección institucional en la Home' : `Traducción de Sobre Nosotros para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              <Input
                label="Cintillo (Eyebrow)"
                value={form.mission_eyebrow || ''}
                onChange={(e) => onChange('mission_eyebrow', e.target.value)}
                placeholder="Nuestra empresa"
              />
              <Input
                label="Título de la sección"
                value={form.mission_title || ''}
                onChange={(e) => onChange('mission_title', e.target.value)}
                placeholder="Líderes en turismo de experiencias en Andorra y los Pirineos."
              />
              <Textarea
                label="Texto descriptivo"
                rows={4}
                value={form.mission_text || ''}
                onChange={(e) => onChange('mission_text', e.target.value)}
                placeholder="Descubre un mundo de experiencias únicas..."
              />
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Foto de la sección (Nuestra empresa)</label>
                {form.mission_image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-bg p-4 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={form.mission_image}
                      alt="Nuestra empresa"
                      className="w-full sm:w-40 h-24 rounded-xl object-cover bg-surface-elevated border border-border flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2 w-full text-left">
                      <p className="text-xs font-semibold text-primary">Imagen asignada</p>
                      <p className="text-[11px] text-muted break-all">{form.mission_image}</p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenPicker('mission_image')}
                        >
                          Cambiar imagen
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onChange('mission_image', '')}
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
                    onClick={() => onOpenPicker('mission_image')}
                  >
                    Seleccionar imagen
                  </Button>
                )}
              </div>
              <Input
                label="Link: Nuestro equipo"
                value={form.mission_team_link || ''}
                onChange={(e) => onChange('mission_team_link', e.target.value)}
                placeholder="Nuestro equipo"
              />
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Cifras destacadas (iWE de un vistazo)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Input
                      value={form.mission_stat1_value || ''}
                      onChange={(e) => onChange('mission_stat1_value', e.target.value)}
                      placeholder="2018"
                    />
                    <Input
                      value={form.mission_stat1_label || ''}
                      onChange={(e) => onChange('mission_stat1_label', e.target.value)}
                      placeholder="año de fundación"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={form.mission_stat2_value || ''}
                      onChange={(e) => onChange('mission_stat2_value', e.target.value)}
                      placeholder="15+"
                    />
                    <Input
                      value={form.mission_stat2_label || ''}
                      onChange={(e) => onChange('mission_stat2_label', e.target.value)}
                      placeholder="tipos de actividades"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={form.mission_stat3_value || ''}
                      onChange={(e) => onChange('mission_stat3_value', e.target.value)}
                      placeholder="2"
                    />
                    <Input
                      value={form.mission_stat3_label || ''}
                      onChange={(e) => onChange('mission_stat3_label', e.target.value)}
                      placeholder="regiones: Andorra y Pirineos"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.mission_title || ''}
                      targetLocale={activeLocale}
                      fieldName="Título de Sobre Nosotros"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'mission_title', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].mission_title || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'mission_title', e.target.value)}
                    placeholder={`Traducción de título (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Texto descriptivo en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.mission_text || ''}
                      targetLocale={activeLocale}
                      fieldName="Texto descriptivo de Sobre Nosotros"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'mission_text', val)}
                    />
                  </div>
                  <Textarea
                    rows={4}
                    value={translations[currentNonEs].mission_text || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'mission_text', e.target.value)}
                    placeholder={`Traducción de descripción (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* 4. Nuestro Equipo */}
      <Card
        title="Sección 'Nuestro Equipo'"
        subtitle={isEs ? 'Presentación del equipo y biografía de Charly Paredes' : `Traducción del equipo para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              <Input
                label="Cintillo (Eyebrow)"
                value={form.team_eyebrow || ''}
                onChange={(e) => onChange('team_eyebrow', e.target.value)}
                placeholder="Nuestro equipo"
              />
              <Input
                label="Título de la sección"
                value={form.team_title || ''}
                onChange={(e) => onChange('team_title', e.target.value)}
                placeholder="Fundada en 2018. Guiada por expertos locales."
              />
              <Textarea
                label="Biografía / Presentación de Charly"
                rows={5}
                value={form.team_bio || ''}
                onChange={(e) => onChange('team_bio', e.target.value)}
                placeholder="iWE nació en 2018 de la mano de Charly Paredes..."
              />
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Foto del equipo (Charly Paredes / Guías)</label>
                {form.team_image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-bg p-4 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={form.team_image}
                      alt="Nuestro equipo"
                      className="w-full sm:w-40 h-24 rounded-xl object-cover bg-surface-elevated border border-border flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2 w-full text-left">
                      <p className="text-xs font-semibold text-primary">Imagen asignada</p>
                      <p className="text-[11px] text-muted break-all">{form.team_image}</p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenPicker('team_image')}
                        >
                          Cambiar imagen
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onChange('team_image', '')}
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
                    onClick={() => onOpenPicker('team_image')}
                  >
                    Seleccionar imagen
                  </Button>
                )}
              </div>
              <Input
                label="Link: Cómo trabajamos"
                value={form.team_contact_link || ''}
                onChange={(e) => onChange('team_contact_link', e.target.value)}
                placeholder="Cómo trabajamos"
              />
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título de equipo en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.team_title || ''}
                      targetLocale={activeLocale}
                      fieldName="Título de la sección equipo"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'team_title', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].team_title || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'team_title', e.target.value)}
                    placeholder={`Traducción de título de equipo (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Biografía en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.team_bio || ''}
                      targetLocale={activeLocale}
                      fieldName="Biografía de Charly"
                      onTranslated={(val) => onTranslationChange(currentNonEs, 'team_bio', val)}
                    />
                  </div>
                  <Textarea
                    rows={5}
                    value={translations[currentNonEs].team_bio || ''}
                    onChange={(e) => onTranslationChange(currentNonEs, 'team_bio', e.target.value)}
                    placeholder={`Traducción de biografía (${activeLocale.toUpperCase()})...`}
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

