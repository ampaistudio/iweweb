import React from 'react';
import { Button } from '../ui/Button';
import { ImagePickerModal } from '../media/ImagePickerModal';
import { LanguageTabs } from '../ui/LanguageSelector';
import { HeroSlidesTab } from './HeroSlidesTab';
import { useContentEditorState } from './useContentEditorState';
import { BrandAndHeroSection } from './BrandAndHeroSection';
import { CompanyAndTeamSection } from './CompanyAndTeamSection';
import { ToursAndContactSection } from './ToursAndContactSection';
import { SeoSocialSection } from './SeoSocialSection';
import { HomeStaticSections } from './HomeStaticSections';
import { SocialLinksSection } from './SocialLinksSection';

export const ContentEditorPage: React.FC = () => {
  const {
    activeLocale,
    setActiveLocale,
    form,
    translations,
    loading,
    isSaving,
    pickerTarget,
    setPickerTarget,
    handleChange,
    handleTranslationChange,
    hasTranslationForLocale,
    handleSelectMedia,
    handleSaveAll,
  } = useContentEditorState();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando textos institucionales...</p>
      </div>
    );
  }

  const isEs = activeLocale === 'es';

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
                {isEs
                  ? 'Español es el idioma base obligatorio.'
                  : 'Traducción de textos institucionales con fallback a español.'}
              </span>
            </div>
            <LanguageTabs
              activeLocale={activeLocale}
              onChangeLocale={setActiveLocale}
              hasTranslation={hasTranslationForLocale}
            />
          </div>

          {/* Brand & Hero Sections */}
          <BrandAndHeroSection
            form={form}
            activeLocale={activeLocale}
            translations={translations}
            onChange={handleChange}
            onTranslationChange={handleTranslationChange}
            onOpenPicker={setPickerTarget}
          />

          {/* Company & Team Sections */}
          <CompanyAndTeamSection
            form={form}
            activeLocale={activeLocale}
            translations={translations}
            onChange={handleChange}
            onTranslationChange={handleTranslationChange}
            onOpenPicker={setPickerTarget}
          />

          {/* Tours & Contact Sections */}
          <ToursAndContactSection
            form={form}
            activeLocale={activeLocale}
            translations={translations}
            onChange={handleChange}
            onTranslationChange={handleTranslationChange}
          />

          {/* SEO & Social Previews */}
          <SeoSocialSection
            form={form}
            activeLocale={activeLocale}
            translations={translations}
            onChange={handleChange}
            onTranslationChange={handleTranslationChange}
            onOpenPicker={setPickerTarget}
          />

          {/* Static Home Sections (Activities, Weather, Calendar, Reviews with toggles and Direct Reviews) */}
          {isEs && (
            <HomeStaticSections
              form={form}
              onChange={handleChange}
            />
          )}

          {/* Official Social Links (Footer) */}
          {isEs && (
            <SocialLinksSection
              form={form}
              onChange={handleChange}
            />
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
            isOpen={pickerTarget !== null}
            onClose={() => setPickerTarget(null)}
            onSelectImage={handleSelectMedia}
            selectedImageUrl={pickerTarget === 'logo' ? form.logo_url : (form.seo_og_image || '')}
          />
        </form>
      </section>
    </div>
  );
};
