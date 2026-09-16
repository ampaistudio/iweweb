import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { MediaItem, DashboardLocale } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { ImagePickerModal } from '../media/ImagePickerModal';
import { LanguageTabs } from '../ui/LanguageSelector';
import { AiTranslateButton } from '../ui/AiTranslateButton';

type NonEsLocale = 'ca' | 'en' | 'fr';

export const ContentEditorPage: React.FC = () => {
  const [activeLocale, setActiveLocale] = useState<DashboardLocale>('es');

  // Base Spanish (ES) form
  const [form, setForm] = useState<Record<string, string>>({
    business_name: '',
    hero_tagline: '',
    mission_title: '',
    mission_text: '',
    team_title: '',
    team_bio: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    logo_url: '',
  });

  // Translations (CA, EN, FR)
  const [translations, setTranslations] = useState<Record<NonEsLocale, Record<string, string>>>({
    ca: {},
    en: {},
    fr: {},
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toast = useToast();

  const handleSelectLogo = (item: MediaItem) => {
    handleChange('logo_url', item.url);
    toast.success(`Logo '${item.original_name}' seleccionado.`);
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await api.content.list();
      if (res) {
        if (res.base || res.content) {
          setForm((prev) => ({
            ...prev,
            ...(res.base || res.content),
          }));
        }
        if (res.translations) {
          setTranslations({
            ca: res.translations.ca || {},
            en: res.translations.en || {},
            fr: res.translations.fr || {},
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los textos';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTranslationChange = (locale: NonEsLocale, key: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [key]: value,
      },
    }));
  };

  const hasTranslationForLocale = (loc: DashboardLocale): boolean => {
    if (loc === 'es') return true;
    const t = translations[loc as NonEsLocale] || {};
    return Object.values(t).some((val) => val && val.trim() !== '');
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const keys = Object.keys(form);
      for (const key of keys) {
        const transMap: Record<string, string> = {
          ca: translations.ca[key] || '',
          en: translations.en[key] || '',
          fr: translations.fr[key] || '',
        };
        await api.content.update(key, form[key] || '', transMap);
      }
      toast.success('Todos los textos institucionales y sus traducciones fueron actualizados.', 'Cambios guardados');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los textos';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando textos institucionales...</p>
      </div>
    );
  }

  const isEs = activeLocale === 'es';
  const currentNonEs = !isEs ? (activeLocale as NonEsLocale) : null;

  return (
    <form onSubmit={handleSaveAll} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Textos de la Web</h2>
          <p className="text-sm text-muted mt-1">
            Edita los textos institucionales, la biografía del equipo y los datos de contacto del sitio público.
          </p>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSaving}
          className="self-start sm:self-auto"
        >
          💾 Guardar todos los cambios
        </Button>
      </div>

      {/* Language Selector Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Idioma de edición:
          </span>
          <span className="text-[11px] text-muted">
            {isEs ? 'Español es el idioma base obligatorio.' : 'Traducción de textos institucionales con fallback a español.'}
          </span>
        </div>
        <LanguageTabs
          activeLocale={activeLocale}
          onChangeLocale={setActiveLocale}
          hasTranslation={hasTranslationForLocale}
        />
      </div>

      {/* 1. Empresa y Marca */}
      <Card
        title="Empresa y Marca"
        subtitle={isEs ? 'Nombre de la empresa, logo y lema del encabezado' : `Traducción del lema y misión para ${activeLocale.toUpperCase()}`}
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
                          onClick={() => setPickerOpen(true)}
                        >
                          Cambiar logo
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChange('logo_url', '')}
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
                    onClick={() => setPickerOpen(true)}
                  >
                    Seleccionar logo
                  </Button>
                )}
              </div>

              <Input
                label="Nombre del negocio (compartido)"
                value={form.business_name || ''}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder="Isard Wildland Experience"
              />

              <Input
                label="Frase principal (Hero Tagline)"
                value={form.hero_tagline || ''}
                onChange={(e) => handleChange('hero_tagline', e.target.value)}
                placeholder="Fabricamos experiencias."
              />

              <Input
                label="Título de 'Sobre Nosotros'"
                value={form.mission_title || ''}
                onChange={(e) => handleChange('mission_title', e.target.value)}
                placeholder="Líderes en turismo de experiencias en Andorra y los Pirineos."
              />

              <Textarea
                label="Texto descriptivo de la empresa"
                rows={4}
                value={form.mission_text || ''}
                onChange={(e) => handleChange('mission_text', e.target.value)}
                placeholder="Descubre un mundo de experiencias únicas con un solo operador turístico..."
              />
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-6">
                {/* Hero Tagline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Frase principal (Hero Tagline) en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.hero_tagline || ''}
                      targetLocale={activeLocale}
                      fieldName="Frase principal"
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'hero_tagline', val)}
                    />
                  </div>
                  <p className="text-xs text-muted italic">Base (ES): {form.hero_tagline || '(vacío)'}</p>
                  <Input
                    value={translations[currentNonEs].hero_tagline || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'hero_tagline', e.target.value)}
                    placeholder={`Traducción de frase principal (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                {/* Mission Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título de 'Sobre Nosotros' en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.mission_title || ''}
                      targetLocale={activeLocale}
                      fieldName="Título de Sobre Nosotros"
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'mission_title', val)}
                    />
                  </div>
                  <p className="text-xs text-muted italic">Base (ES): {form.mission_title || '(vacío)'}</p>
                  <Input
                    value={translations[currentNonEs].mission_title || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'mission_title', e.target.value)}
                    placeholder={`Traducción de título (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                {/* Mission Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Texto descriptivo de la empresa en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.mission_text || ''}
                      targetLocale={activeLocale}
                      fieldName="Texto descriptivo de la empresa"
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'mission_text', val)}
                    />
                  </div>
                  <p className="text-xs text-muted italic">Base (ES): {form.mission_text || '(vacío)'}</p>
                  <Textarea
                    rows={4}
                    value={translations[currentNonEs].mission_text || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'mission_text', e.target.value)}
                    placeholder={`Traducción de descripción (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* 2. Equipo y Guías */}
      <Card
        title="Nuestro Equipo"
        subtitle={isEs ? 'Presentación del equipo y biografía de Charly Paredes' : `Traducción del equipo para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              <Input
                label="Título de la sección equipo"
                value={form.team_title || ''}
                onChange={(e) => handleChange('team_title', e.target.value)}
                placeholder="Fundada en 2018. Guiada por expertos locales."
              />

              <Textarea
                label="Biografía / Presentación de Charly"
                rows={5}
                value={form.team_bio || ''}
                onChange={(e) => handleChange('team_bio', e.target.value)}
                placeholder="iWE nació en 2018 de la mano de Charly Paredes, guía de montaña nivel 2..."
              />
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-6">
                {/* Team Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título de equipo en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.team_title || ''}
                      targetLocale={activeLocale}
                      fieldName="Título de la sección equipo"
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'team_title', val)}
                    />
                  </div>
                  <p className="text-xs text-muted italic">Base (ES): {form.team_title || '(vacío)'}</p>
                  <Input
                    value={translations[currentNonEs].team_title || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'team_title', e.target.value)}
                    placeholder={`Traducción de título de equipo (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                {/* Team Bio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Biografía / Presentación en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={form.team_bio || ''}
                      targetLocale={activeLocale}
                      fieldName="Biografía de Charly"
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'team_bio', val)}
                    />
                  </div>
                  <p className="text-xs text-muted italic">Base (ES): {form.team_bio || '(vacío)'}</p>
                  <Textarea
                    rows={5}
                    value={translations[currentNonEs].team_bio || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'team_bio', e.target.value)}
                    placeholder={`Traducción de biografía (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* 3. Datos de Contacto (Compartidos, solo visibles en ES) */}
      {isEs && (
        <Card title="Datos de Contacto" subtitle="Información visible en el pie de página y botones de contacto (compartida)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono de contacto"
              value={form.contact_phone || ''}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="+376 344 870"
            />

            <Input
              label="Correo electrónico"
              type="email"
              value={form.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="info@i-wildland.com"
            />

            <div className="sm:col-span-2">
              <Input
                label="Dirección física"
                value={form.contact_address || ''}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                placeholder="AD100 Canillo, Principat d'Andorra"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          className="w-full sm:w-auto"
        >
          💾 Guardar todos los cambios
        </Button>
      </div>

      <ImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectImage={handleSelectLogo}
        selectedImageUrl={form.logo_url}
      />
    </form>
  );
};
