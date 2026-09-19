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
import { HeroSlidesTab } from './HeroSlidesTab';

type NonEsLocale = 'ca' | 'en' | 'fr';

export const ContentEditorPage: React.FC = () => {
  const [activeLocale, setActiveLocale] = useState<DashboardLocale>('es');

  // Base Spanish (ES) form
  const [form, setForm] = useState<Record<string, string>>({
    business_name: '',
    hero_eyebrow: 'Elige tu experiencia con nosotros',
    hero_title_line1: 'Todas las experiencias.',
    hero_title_line2: 'Un solo operador.',
    hero_copy: 'iWE, la agencia líder en turismo de experiencias. Esquí, snowboard, raquetas de nieve, BTT, 4x4, vía ferrata, senderismo y mucho más en Andorra y los Pirineos, todo el año.',
    hero_tagline: 'Fabricamos experiencias.',
    mission_eyebrow: 'Nuestra empresa',
    mission_title: 'Líderes en turismo de experiencias en Andorra y los Pirineos.',
    mission_text: 'Descubre un mundo de experiencias únicas con un solo operador turístico...',
    team_eyebrow: 'Nuestro equipo',
    team_title: 'Fundada en 2018. Guiada por expertos locales.',
    team_bio: 'iWE nació en 2018 de la mano de Charly Paredes...',
    contact_eyebrow: 'Mantente inspirado',
    contact_title_line1: 'Más montaña.',
    contact_title_line2: 'Menos rutina.',
    contact_copy: 'Recibe novedades, disponibilidad de actividades y un poco de inspiración para tu próxima aventura. Sin ruido. Solo lo bueno.',
    contact_phone: '+376 653 769',
    contact_email: 'info@i-wildland.com',
    contact_address: 'Av. de Sant Antoni, 12, AD400 La Massana, Andorra',
    tours_section_published: 'true',
    tours_eyebrow: 'Tours en Andorra',
    tours_title_line1: 'Vacaciones',
    tours_title_line2: 'completas con iWE.',
    tours_copy: 'Combina alojamiento, guías y actividades en un solo paquete. Ideal para grupos, familias y viajes de aventura sin preocuparte por la logística.',
    tours_cta_text: 'Consultar disponibilidad',
    logo_url: '',
    logo_height: '44',
    social_instagram: 'https://www.instagram.com/isardwildland/',
    social_facebook: 'https://www.facebook.com/isardwildland/',
    social_youtube: '',
    social_tiktok: '',
    social_tripadvisor: '',
    social_strava: '',
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
    <div className="space-y-12">
      {/* 1. Hero Slides Section */}
      <section aria-labelledby="hero-slides-section">
        <HeroSlidesTab />
      </section>

      <hr className="border-border" />

      {/* 2. Institutional Texts Section */}
      <section aria-labelledby="site-texts-section">
        <form onSubmit={handleSaveAll} className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 id="site-texts-section" className="text-2xl font-bold tracking-tight text-primary">
                Textos Institucionales de la Web
              </h2>
              <p className="text-sm text-muted mt-1">
                Edita los textos de presentación, la biografía del equipo y los datos de contacto del sitio público.
              </p>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              className="self-start sm:self-auto"
            >
              💾 Guardar textos institucionales
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-secondary">
                    Altura del Logo en el Header: <span className="font-bold text-accent font-mono">{form.logo_height || '44'}px</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleChange('logo_height', '44')}
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
                  onChange={(e) => handleChange('logo_height', e.target.value)}
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
                onChange={(e) => handleChange('business_name', e.target.value)}
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
                onChange={(e) => handleChange('hero_eyebrow', e.target.value)}
                placeholder="Elige tu experiencia con nosotros"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Título principal (Línea 1)"
                  value={form.hero_title_line1 || ''}
                  onChange={(e) => handleChange('hero_title_line1', e.target.value)}
                  placeholder="Todas las experiencias."
                />
                <Input
                  label="Título principal (Línea 2 - Destacado)"
                  value={form.hero_title_line2 || ''}
                  onChange={(e) => handleChange('hero_title_line2', e.target.value)}
                  placeholder="Un solo operador."
                />
              </div>
              <Textarea
                label="Texto descriptivo del Hero (Copy)"
                rows={3}
                value={form.hero_copy || ''}
                onChange={(e) => handleChange('hero_copy', e.target.value)}
                placeholder="iWE, la agencia líder en turismo de experiencias..."
              />
              <Input
                label="Frase de pie de foto (Hero Tagline)"
                value={form.hero_tagline || ''}
                onChange={(e) => handleChange('hero_tagline', e.target.value)}
                placeholder="Fabricamos experiencias."
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'hero_eyebrow', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].hero_eyebrow || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'hero_eyebrow', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'hero_title_line1', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].hero_title_line1 || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'hero_title_line1', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'hero_title_line2', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].hero_title_line2 || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'hero_title_line2', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'hero_copy', val)}
                    />
                  </div>
                  <Textarea
                    rows={3}
                    value={translations[currentNonEs].hero_copy || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'hero_copy', e.target.value)}
                    placeholder={`Traducción de texto descriptivo (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

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
                onChange={(e) => handleChange('mission_eyebrow', e.target.value)}
                placeholder="Nuestra empresa"
              />
              <Input
                label="Título de la sección"
                value={form.mission_title || ''}
                onChange={(e) => handleChange('mission_title', e.target.value)}
                placeholder="Líderes en turismo de experiencias en Andorra y los Pirineos."
              />
              <Textarea
                label="Texto descriptivo"
                rows={4}
                value={form.mission_text || ''}
                onChange={(e) => handleChange('mission_text', e.target.value)}
                placeholder="Descubre un mundo de experiencias únicas..."
              />
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'mission_title', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].mission_title || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'mission_title', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'mission_text', val)}
                    />
                  </div>
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
                onChange={(e) => handleChange('team_eyebrow', e.target.value)}
                placeholder="Nuestro equipo"
              />
              <Input
                label="Título de la sección"
                value={form.team_title || ''}
                onChange={(e) => handleChange('team_title', e.target.value)}
                placeholder="Fundada en 2018. Guiada por expertos locales."
              />
              <Textarea
                label="Biografía / Presentación de Charly"
                rows={5}
                value={form.team_bio || ''}
                onChange={(e) => handleChange('team_bio', e.target.value)}
                placeholder="iWE nació en 2018 de la mano de Charly Paredes..."
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'team_title', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].team_title || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'team_title', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'team_bio', val)}
                    />
                  </div>
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

      {/* 5. Vacaciones completas con iWE (Tours y Paquetes) */}
      <Card
        title="Sección 'Vacaciones completas con iWE' (Tours y Paquetes)"
        subtitle={isEs ? 'Control de visibilidad y textos de la sección de paquetes en la Home' : `Traducción de Tours y Paquetes para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              {/* Toggle de publicación */}
              <div className="flex items-center justify-between p-3.5 bg-surface-elevated rounded-xl border border-border">
                <div>
                  <p className="text-sm font-semibold text-primary">Publicar sección en la Home</p>
                  <p className="text-xs text-muted">
                    {form.tours_section_published !== 'false' && form.tours_section_published !== '0'
                      ? 'La sección se muestra actualmente en la página principal.'
                      : 'La sección está oculta en la página principal.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tours_section_published !== 'false' && form.tours_section_published !== '0'}
                    onChange={(e) => handleChange('tours_section_published', e.target.checked ? 'true' : 'false')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                </label>
              </div>

              <Input
                label="Cintillo (Eyebrow)"
                value={form.tours_eyebrow || ''}
                onChange={(e) => handleChange('tours_eyebrow', e.target.value)}
                placeholder="Tours en Andorra"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Título (Línea 1)"
                  value={form.tours_title_line1 || ''}
                  onChange={(e) => handleChange('tours_title_line1', e.target.value)}
                  placeholder="Vacaciones"
                />
                <Input
                  label="Título (Línea 2 - Destacada)"
                  value={form.tours_title_line2 || ''}
                  onChange={(e) => handleChange('tours_title_line2', e.target.value)}
                  placeholder="completas con iWE."
                />
              </div>
              <Textarea
                label="Texto descriptivo"
                rows={3}
                value={form.tours_copy || ''}
                onChange={(e) => handleChange('tours_copy', e.target.value)}
                placeholder="Combina alojamiento, guías y actividades en un solo paquete..."
              />
              <Input
                label="Texto del botón CTA"
                value={form.tours_cta_text || ''}
                onChange={(e) => handleChange('tours_cta_text', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'tours_eyebrow', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].tours_eyebrow || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'tours_eyebrow', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'tours_title_line1', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].tours_title_line1 || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'tours_title_line1', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'tours_title_line2', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].tours_title_line2 || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'tours_title_line2', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'tours_copy', val)}
                    />
                  </div>
                  <Textarea
                    rows={3}
                    value={translations[currentNonEs].tours_copy || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'tours_copy', e.target.value)}
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'tours_cta_text', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].tours_cta_text || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'tours_cta_text', e.target.value)}
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
                onChange={(e) => handleChange('contact_eyebrow', e.target.value)}
                placeholder="Mantente inspirado"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Título (Línea 1)"
                  value={form.contact_title_line1 || ''}
                  onChange={(e) => handleChange('contact_title_line1', e.target.value)}
                  placeholder="Más montaña."
                />
                <Input
                  label="Título (Línea 2)"
                  value={form.contact_title_line2 || ''}
                  onChange={(e) => handleChange('contact_title_line2', e.target.value)}
                  placeholder="Menos rutina."
                />
              </div>
              <Textarea
                label="Texto de suscripción / contacto"
                rows={3}
                value={form.contact_copy || ''}
                onChange={(e) => handleChange('contact_copy', e.target.value)}
                placeholder="Recibe novedades, disponibilidad de actividades..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Teléfono de contacto (WhatsApp)"
                  value={form.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+376 653 769"
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
                      onTranslated={(val) => handleTranslationChange(currentNonEs, 'contact_copy', val)}
                    />
                  </div>
                  <Textarea
                    rows={3}
                    value={translations[currentNonEs].contact_copy || ''}
                    onChange={(e) => handleTranslationChange(currentNonEs, 'contact_copy', e.target.value)}
                    placeholder={`Traducción de texto de contacto (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* 4. Redes Sociales Oficiales */}
      {isEs && (
        <Card title="Redes Sociales Oficiales" subtitle="Enlaces a los perfiles y canales de iWE mostrados en el pie de página (Footer)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="📷 Instagram (URL)"
              value={form.social_instagram || ''}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              placeholder="https://www.instagram.com/isardwildland/"
            />
            <Input
              label="📘 Facebook (URL)"
              value={form.social_facebook || ''}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              placeholder="https://www.facebook.com/isardwildland/"
            />
            <Input
              label="▶️ YouTube (URL)"
              value={form.social_youtube || ''}
              onChange={(e) => handleChange('social_youtube', e.target.value)}
              placeholder="https://www.youtube.com/@isardwildland"
            />
            <Input
              label="🎵 TikTok (URL)"
              value={form.social_tiktok || ''}
              onChange={(e) => handleChange('social_tiktok', e.target.value)}
              placeholder="https://www.tiktok.com/@isardwildland"
            />
            <Input
              label="🦉 TripAdvisor (URL)"
              value={form.social_tripadvisor || ''}
              onChange={(e) => handleChange('social_tripadvisor', e.target.value)}
              placeholder="https://www.tripadvisor.com/Attraction_Review..."
            />
            <Input
              label="🚴 Strava (Club / Perfil)"
              value={form.social_strava || ''}
              onChange={(e) => handleChange('social_strava', e.target.value)}
              placeholder="https://www.strava.com/clubs/..."
            />
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
      </section>
    </div>
  );
};
