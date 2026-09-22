import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../core/ui/Button';
import { ImagePickerModal } from '../core/media/ImagePickerModal';
import { CoverImagePickerModal } from './CoverImagePickerModal';
import { AddToMenuModal } from './AddToMenuModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import { LanguageTabs } from '../core/ui/LanguageSelector';
import { ActivityBasicInfoSection } from './ActivityBasicInfoSection';
import { ActivityDescriptionSection } from './ActivityDescriptionSection';
import { ActivityGallerySection } from './ActivityGallerySection';
import { ActivityTranslationsSection } from './ActivityTranslationsSection';
import { ActivitySocialShareSection } from './ActivitySocialShareSection';
import { ActivityVideoModal } from './ActivityVideoModal';
import { useActivityEditorState } from './useActivityEditorState';

export const ActivityEditorPage: React.FC = () => {
  const state = useActivityEditorState();

  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando datos de la actividad...</p>
      </div>
    );
  }

  const isEs = state.activeLocale === 'es';

  return (
    <form onSubmit={state.handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/activities">
            <Button variant="ghost" size="sm" type="button">
              ← Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              {state.isEdit ? 'Editar Actividad' : 'Nueva Actividad'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Completa los datos de la experiencia de montaña para el sitio público.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={state.isSaving}
          >
            💾 {state.published ? 'Guardar y Publicar' : 'Guardar Oculto'}
          </Button>
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Idioma de edición:
          </span>
          <span className="text-[11px] text-muted">
            {isEs ? 'Español es el idioma base obligatorio.' : 'Las traducciones son opcionales con fallback a español.'}
          </span>
        </div>
        <LanguageTabs
          activeLocale={state.activeLocale}
          onChangeLocale={state.setActiveLocale}
          hasTranslation={state.hasTranslationForLocale}
        />
      </div>

      {/* Basic Info, Details, Main Cover, and Published Toggle */}
      {isEs && (
        <ActivityBasicInfoSection
          title={state.title}
          onTitleChange={state.handleTitleChange}
          type={state.type}
          setType={state.setType}
          availableCategories={state.availableCategories}
          onOpenCategoryModal={() => state.setCategoryModalOpen(true)}
          slugId={state.slugId}
          setSlugId={state.setSlugId}
          isEdit={state.isEdit}
          region={state.region}
          setRegion={state.setRegion}
          country={state.country}
          setCountry={state.setCountry}
          level={state.level}
          setLevel={state.setLevel}
          duration={state.duration}
          setDuration={state.setDuration}
          price={state.price}
          setPrice={state.setPrice}
          imageUrl={state.imageUrl}
          setImageUrl={state.setImageUrl}
          altText={state.altText}
          setAltText={state.setAltText}
          onOpenPicker={() => state.setPickerOpen(true)}
          published={state.published}
          setPublished={state.setPublished}
        />
      )}

      {/* Multimedia Gallery (ES + Edit mode) */}
      {isEs && state.isEdit && (
        <ActivityGallerySection
          images={state.images}
          isGalleryLoading={state.isGalleryLoading}
          galleryCardRef={state.galleryCardRef}
          onOpenGalleryPicker={() => state.setGalleryPickerOpen(true)}
          onOpenVideoModal={() => state.setVideoModalOpen(true)}
          onMoveImage={state.handleMoveGalleryImage}
          onSetCover={state.handleSetCover}
          onRemoveImage={state.handleRemoveGalleryImage}
        />
      )}

      {/* Description & Highlights (ES mode) */}
      {isEs && (
        <ActivityDescriptionSection
          introTitle={state.introTitle}
          setIntroTitle={state.setIntroTitle}
          introText={state.introText}
          setIntroText={state.setIntroText}
          description={state.description}
          setDescription={state.setDescription}
          highlights={state.highlights}
          onAddHighlight={state.handleAddHighlight}
          onHighlightChange={state.handleHighlightChange}
          onRemoveHighlight={state.handleRemoveHighlight}
        />
      )}

      {/* Translations (Non-ES modes) */}
      <ActivityTranslationsSection
        activeLocale={state.activeLocale}
        translations={state.translations}
        baseTitle={state.title}
        baseRegion={state.region}
        baseCountry={state.country}
        baseLevel={state.level}
        baseDuration={state.duration}
        baseAltText={state.altText}
        baseIntroTitle={state.introTitle}
        baseIntroText={state.introText}
        baseDescription={state.description}
        baseHighlights={state.highlights}
        onUpdateTranslationField={state.updateTranslationField}
        onUpdateTranslationHighlight={state.updateTranslationHighlight}
      />

      {/* Social Share Section (ES mode) */}
      {isEs && (
        <ActivitySocialShareSection
          isEdit={state.isEdit}
          publishToFacebook={state.publishToFacebook}
          setPublishToFacebook={state.setPublishToFacebook}
          publishToInstagram={state.publishToInstagram}
          setPublishToInstagram={state.setPublishToInstagram}
          socialLinks={state.socialLinks}
          isSharingSocial={state.isSharingSocial}
          onManualSocialShare={state.handleManualSocialShare}
        />
      )}

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Link to="/activities">
          <Button variant="secondary" size="lg" type="button">
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={state.isSaving}
        >
          💾 Guardar actividad
        </Button>
      </div>

      {/* Cover Image Picker Modal */}
      {state.isEdit ? (
        <CoverImagePickerModal
          isOpen={state.pickerOpen}
          onClose={() => state.setPickerOpen(false)}
          onSelectImage={state.handleSelectCoverFromGallery}
          images={state.images}
          selectedImageUrl={state.imageUrl}
          onGoToGallery={state.scrollToGallery}
        />
      ) : (
        <ImagePickerModal
          isOpen={state.pickerOpen}
          onClose={() => state.setPickerOpen(false)}
          onSelectImage={state.handleSelectImage}
          selectedImageUrl={state.imageUrl}
        />
      )}

      {/* Gallery Image Picker Modal */}
      <ImagePickerModal
        isOpen={state.galleryPickerOpen}
        onClose={() => state.setGalleryPickerOpen(false)}
        onSelectImage={state.handleAddGalleryImage}
      />

      {/* Add to Menu Modal */}
      <AddToMenuModal
        isOpen={state.addToMenuOpen}
        onClose={() => {
          state.setAddToMenuOpen(false);
          state.navigate('/activities');
        }}
        activityId={state.newlyCreatedId || state.id || ''}
        activityTitle={state.title}
      />

      {/* Video URL Modal */}
      <ActivityVideoModal
        isOpen={state.videoModalOpen}
        onClose={() => state.setVideoModalOpen(false)}
        videoInputUrl={state.videoInputUrl}
        setVideoInputUrl={state.setVideoInputUrl}
        videoInputPoster={state.videoInputPoster}
        setVideoInputPoster={state.setVideoInputPoster}
        videoInputAlt={state.videoInputAlt}
        setVideoInputAlt={state.setVideoInputAlt}
        isVideoSubmitting={state.isVideoSubmitting}
        onSubmit={state.handleAddVideo}
        title={state.title}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={state.categoryModalOpen}
        onClose={() => state.setCategoryModalOpen(false)}
        onCategoriesUpdated={(cats) => {
          state.setAvailableCategories(cats.map((c) => c.name));
        }}
      />
    </form>
  );
};
