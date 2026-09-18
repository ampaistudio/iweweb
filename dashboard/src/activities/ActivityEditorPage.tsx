import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ACTIVITY_TYPES, type Activity, type ActivityType, type ActivityImage } from './types';
import type { MediaItem, DashboardLocale } from '../api/types';
import { useToast } from '../core/ui/ToastContext';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import { RichTextEditor } from '../core/ui/RichTextEditor';
import { Select } from '../core/ui/Select';
import { Toggle } from '../core/ui/Toggle';
import { ImagePickerModal } from '../core/media/ImagePickerModal';
import { CoverImagePickerModal } from './CoverImagePickerModal';
import { LanguageTabs } from '../core/ui/LanguageSelector';
import { AiTranslateButton } from '../core/ui/AiTranslateButton';

type NonEsLocale = 'ca' | 'en' | 'fr';

interface LocaleActivityData {
  title: string;
  description: string;
  intro_title: string;
  intro_text: string;
  highlights: string[];
}

export const ActivityEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');

  const [activeLocale, setActiveLocale] = useState<DashboardLocale>('es');

  // Base Spanish (ES) state
  const [title, setTitle] = useState('');
  const [slugId, setSlugId] = useState('');
  const [type, setType] = useState<ActivityType>('BTT');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('Andorra');
  const [level, setLevel] = useState('Todos los niveles');
  const [duration, setDuration] = useState('4 horas');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');
  const [introTitle, setIntroTitle] = useState('');
  const [introText, setIntroText] = useState('');
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [published, setPublished] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);

  // Gallery state
  const [images, setImages] = useState<ActivityImage[]>([]);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoInputUrl, setVideoInputUrl] = useState('');
  const [videoInputPoster, setVideoInputPoster] = useState('');
  const [videoInputAlt, setVideoInputAlt] = useState('');
  const [isVideoSubmitting, setIsVideoSubmitting] = useState(false);

  // Translations (CA, EN, FR)
  const [translations, setTranslations] = useState<Record<NonEsLocale, LocaleActivityData>>({
    ca: { title: '', description: '', intro_title: '', intro_text: '', highlights: [] },
    en: { title: '', description: '', intro_title: '', intro_text: '', highlights: [] },
    fr: { title: '', description: '', intro_title: '', intro_text: '', highlights: [] },
  });

  const [loading, setLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && id) {
      const loadActivity = async () => {
        try {
          setLoading(true);
          const act = (await api.activities.get(id)) as Activity;
          setTitle(act.title);
          setSlugId(act.id);
          setType(act.type);
          setRegion(act.region);
          setCountry(act.country);
          setLevel(act.level);
          setDuration(act.duration);
          setPrice(act.price || '');
          setImageUrl(act.image_url || act.image);
          setAltText(act.alt_text || act.alt);
          setDescription(act.description);
          setIntroTitle(act.intro_title || '');
          setIntroText(act.intro_text || '');
          setHighlights(act.highlights && act.highlights.length > 0 ? act.highlights : ['']);
          setPublished(act.published);
          setDisplayOrder(act.display_order || 1);

          if (act.images && act.images.length > 0) {
            setImages(act.images);
          }

          if (act.translations) {
            setTranslations({
              ca: {
                title: act.translations.ca?.title || '',
                description: act.translations.ca?.description || '',
                intro_title: act.translations.ca?.intro_title || '',
                intro_text: act.translations.ca?.intro_text || '',
                highlights: act.translations.ca?.highlights || [],
              },
              en: {
                title: act.translations.en?.title || '',
                description: act.translations.en?.description || '',
                intro_title: act.translations.en?.intro_title || '',
                intro_text: act.translations.en?.intro_text || '',
                highlights: act.translations.en?.highlights || [],
              },
              fr: {
                title: act.translations.fr?.title || '',
                description: act.translations.fr?.description || '',
                intro_title: act.translations.fr?.intro_title || '',
                intro_text: act.translations.fr?.intro_text || '',
                highlights: act.translations.fr?.highlights || [],
              },
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al cargar la actividad';
          toast.error(msg);
          navigate('/activities');
        } finally {
          setLoading(false);
        }
      };
      loadActivity();
    }
  }, [id, isEdit, navigate, toast]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit && !slugId) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlugId(generated);
    }
  };

  const handleSelectImage = (item: MediaItem) => {
    setImageUrl(item.url);
    if (!altText) {
      setAltText(`Foto de ${title || 'actividad iWE'}`);
    }
    toast.success(`Foto '${item.original_name}' seleccionada.`);
  };

  const handleSelectCoverFromGallery = (img: ActivityImage) => {
    setImageUrl(img.image_url);
    setAltText(img.alt_text);
    toast.success('Foto principal actualizada. Guardá la actividad para confirmar el cambio.');
  };

  const galleryCardRef = React.useRef<HTMLDivElement>(null);
  const scrollToGallery = () => {
    galleryCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddGalleryImage = async (item: MediaItem) => {
    if (!isEdit || !id) {
      toast.info('Guarda la actividad primero para agregar más fotos a su galería.');
      return;
    }
    try {
      setIsGalleryLoading(true);
      const newImg = (await api.activities.addImage(id, {
        image_url: item.url,
        alt_text: `Foto de ${title || 'actividad iWE'}`,
      })) as ActivityImage;
      setImages((prev) => [...prev, newImg]);
      toast.success(`Foto '${item.original_name}' agregada a la galería.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agregar imagen a la galería';
      toast.error(msg);
    } finally {
      setIsGalleryLoading(false);
      setGalleryPickerOpen(false);
    }
  };

  const handleSetCover = async (imageId: number) => {
    if (!id) return;
    try {
      setIsGalleryLoading(true);
      await api.activities.setCoverImage(id, imageId);
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_cover: img.id === imageId,
        }))
      );
      const cov = images.find((img) => img.id === imageId);
      if (cov) {
        setImageUrl(cov.image_url);
        setAltText(cov.alt_text);
      }
      toast.success('Portada actualizada correctamente.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar portada';
      toast.error(msg);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleRemoveGalleryImage = async (imageId: number) => {
    if (!id) return;
    if (images.length <= 1) {
      toast.error('La actividad debe tener al menos una imagen en la galería.');
      return;
    }
    try {
      setIsGalleryLoading(true);
      await api.activities.removeImage(id, imageId);
      const act = (await api.activities.get(id)) as Activity;
      if (act.images) {
        setImages(act.images);
      }
      setImageUrl(act.image_url || act.image);
      setAltText(act.alt_text || act.alt);
      toast.success('Imagen eliminada de la galería.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar imagen';
      toast.error(msg);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleMoveGalleryImage = async (index: number, direction: 'up' | 'down') => {
    if (!id) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.splice(targetIndex, 0, moved);

    const reordered = newImages.map((img, idx) => ({ ...img, display_order: idx }));
    setImages(reordered);

    try {
      await api.activities.reorderImages(
        id,
        reordered.map((img) => ({ id: img.id, display_order: img.display_order }))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reordenar galería';
      toast.error(msg);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !videoInputUrl.trim()) {
      toast.error('Ingresa una URL de video válida (YouTube, Vimeo o enlace a archivo de video).');
      return;
    }
    setIsVideoSubmitting(true);
    try {
      const newImg = await api.activities.addImage(id, {
        image_url: videoInputUrl.trim(),
        media_type: 'video',
        poster_url: videoInputPoster.trim() || undefined,
        alt_text: videoInputAlt.trim() || `Video de ${title || 'actividad'}`,
      });
      setImages((prev) => [...prev, newImg]);
      setVideoModalOpen(false);
      setVideoInputUrl('');
      setVideoInputPoster('');
      setVideoInputAlt('');
      toast.success('Video agregado a la galería.', 'Galería actualizada');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agregar video';
      toast.error(msg);
    } finally {
      setIsVideoSubmitting(false);
    }
  };

  const handleAddHighlight = () => {
    setHighlights((prev) => [...prev, '']);
  };

  const handleHighlightChange = (index: number, val: string) => {
    setHighlights((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
    // Also remove from translations
    setTranslations((prev) => {
      const copy = { ...prev };
      (['ca', 'en', 'fr'] as NonEsLocale[]).forEach((loc) => {
        copy[loc] = {
          ...copy[loc],
          highlights: (copy[loc].highlights || []).filter((_, i) => i !== index),
        };
      });
      return copy;
    });
  };

  const updateTranslationField = (locale: NonEsLocale, field: 'title' | 'description' | 'intro_title' | 'intro_text', val: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: val,
      },
    }));
  };

  const updateTranslationHighlight = (locale: NonEsLocale, index: number, val: string) => {
    setTranslations((prev) => {
      const currentList = [...(prev[locale].highlights || [])];
      while (currentList.length < highlights.length) {
        currentList.push('');
      }
      currentList[index] = val;
      return {
        ...prev,
        [locale]: {
          ...prev[locale],
          highlights: currentList,
        },
      };
    });
  };

  const hasTranslationForLocale = (loc: DashboardLocale): boolean => {
    if (loc === 'es') return Boolean(title.trim());
    const t = translations[loc as NonEsLocale];
    return Boolean(t?.title?.trim() || t?.description?.trim() || t?.highlights?.some((h) => h.trim()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('El título de la actividad (en Español) es obligatorio.');
      return;
    }
    if (!region.trim()) {
      toast.error('La región es obligatoria.');
      return;
    }
    if (!imageUrl.trim()) {
      toast.error('Debes seleccionar o ingresar una foto para la actividad.');
      return;
    }
    if (!description.trim()) {
      toast.error('La descripción de la actividad (en Español) es obligatoria.');
      return;
    }

    setIsSaving(true);

    try {
      const cleanHighlights = highlights.map((h) => h.trim()).filter(Boolean);

      const payload = {
        id: slugId.trim() || undefined,
        title: title.trim(),
        region: region.trim(),
        country: country.trim(),
        type,
        level: level.trim(),
        duration: duration.trim(),
        price: price.trim() || null,
        image: imageUrl.trim(),
        image_url: imageUrl.trim(),
        alt: altText.trim() || `Experiencia de ${title}`,
        alt_text: altText.trim() || `Experiencia de ${title}`,
        description: description.trim(),
        intro_title: introTitle.trim() || null,
        intro_text: introText.trim() || null,
        highlights: cleanHighlights,
        published,
        display_order: Number(displayOrder) || 1,
        translations,
      };

      if (isEdit && id) {
        await api.activities.update(id, payload);
        toast.success(`Actividad '${title}' actualizada con éxito.`, 'Guardado');
      } else {
        await api.activities.create(payload);
        toast.success(`Actividad '${title}' creada con éxito.`, 'Actividad creada');
      }
      navigate('/activities');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la actividad';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando datos de la actividad...</p>
      </div>
    );
  }

  const isEs = activeLocale === 'es';
  const currentNonEs = !isEs ? (activeLocale as NonEsLocale) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
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
              {isEdit ? 'Editar Actividad' : 'Nueva Actividad'}
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
            isLoading={isSaving}
          >
            💾 {published ? 'Guardar y Publicar' : 'Guardar Oculto'}
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
          activeLocale={activeLocale}
          onChangeLocale={setActiveLocale}
          hasTranslation={hasTranslationForLocale}
        />
      </div>

      {/* 1. Información Principal */}
      <Card
        title="Información Principal"
        subtitle={isEs ? 'Nombre, categoría y ubicación' : `Traducción de título para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              <Input
                label="Título de la actividad (Español - Principal)"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej: E-Bike Enduro en Forn de Canillo"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Categoría / Tipo de experiencia"
                  value={type}
                  onChange={(e) => setType(e.target.value as ActivityType)}
                  options={ACTIVITY_TYPES.map((t) => ({ value: t, label: t }))}
                  helperText="El sitio público agrupa los menús por esta categoría."
                />

                <Input
                  label="Identificador URL (Slug)"
                  value={slugId}
                  onChange={(e) => setSlugId(e.target.value)}
                  placeholder="ebike-forn-canillo"
                  disabled={isEdit}
                  helperText={isEdit ? 'El identificador no se puede modificar tras crearse.' : 'Se usa en el enlace /tour/:id'}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Región / Zona"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Ej: Canillo, Grandvalira, Pirineos"
                  required
                />

                <Input
                  label="País"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Andorra / España"
                  required
                />
              </div>
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-3">
                <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
                  <span className="font-semibold text-primary block mb-1">Título base en Español:</span>
                  <p className="italic">{title || '(Sin título ingresado aún)'}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={title}
                      targetLocale={activeLocale}
                      fieldName="Título de la actividad"
                      onTranslated={(val) => updateTranslationField(currentNonEs, 'title', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].title}
                    onChange={(e) => updateTranslationField(currentNonEs, 'title', e.target.value)}
                    placeholder={`Título traducido (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* 2. Detalles de la Experiencia (Solo en modo ES ya que son datos no editoriales) */}
      {isEs && (
        <Card title="Detalles del Recorrido" subtitle="Nivel, duración y precio (compartidos)">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nivel / Dificultad"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="Principiante, Intermedio +, etc."
              required
            />

            <Input
              label="Duración"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="4 horas, Día completo, etc."
              required
            />

            <Input
              label="Precio (opcional)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="€85 por persona"
              helperText="Dejar vacío si no aplica precio fijo."
            />
          </div>
        </Card>
      )}

      {/* 3. Foto de la Actividad (Compartida) */}
      {isEs && (
        <Card title="Foto Principal" subtitle="Imagen de cabecera y accesibilidad">
          <div className="space-y-4">
            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-border bg-bg p-4 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={imageUrl}
                  alt={altText || 'Foto de actividad'}
                  className="w-full sm:w-40 h-32 rounded-xl object-cover border border-border flex-shrink-0"
                />
                <div className="flex-1 space-y-2 w-full text-left">
                  <p className="text-xs font-semibold text-primary">Foto asignada a la actividad</p>
                  <p className="text-[11px] text-muted break-all">{imageUrl}</p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setPickerOpen(true)}
                    >
                      Cambiar foto
                    </Button>
                    {isEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setImageUrl('')}
                        className="text-danger-text hover:text-danger"
                      >
                        Quitar foto
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPickerOpen(true)}
                leftIcon="📸"
                className="w-full justify-center py-6 border-dashed"
              >
                Elegir foto de la galería
              </Button>
            )}
            {isEdit && (
              <p className="text-[11px] text-muted">
                La foto principal se elige entre las fotos que ya están en la Galería Multimedia de esta actividad.
              </p>
            )}

            <Input
              label="Texto alternativo de la foto (accesibilidad)"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Ej: Excursión en 4x4 por los caminos de alta montaña en Andorra"
              helperText="Describe la foto para lectores de pantalla y buscadores."
              required
            />
          </div>
        </Card>
      )}

      {/* 3.1. Galería de Fotos y Videos (Solo en ES y modo edición) */}
      {isEs && isEdit && (
        <div ref={galleryCardRef}>
        <Card
          title="Galería Multimedia"
          subtitle="Fotos y videos para enriquecer el hero y la página de detalle del tour"
          action={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setGalleryPickerOpen(true)}
                isLoading={isGalleryLoading}
              >
                📷 Agregar foto
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setVideoModalOpen(true)}
              >
                🎥 Agregar video (URL)
              </Button>
            </div>
          }
        >
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm border-2 border-dashed border-border rounded-xl">
              No hay fotos ni videos en la galería. Haz clic en "Agregar foto" o "Agregar video" para comenzar.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className={`relative group rounded-xl overflow-hidden border transition-all ${
                    img.is_cover ? 'border-accent ring-2 ring-accent/30 shadow-md' : 'border-border hover:border-border-hover'
                  } bg-bg flex flex-col`}
                >
                  <div className="aspect-square relative overflow-hidden bg-surface flex items-center justify-center">
                    {img.media_type === 'video' ? (
                      <div className="w-full h-full bg-surface-hover/80 text-primary flex flex-col items-center justify-center p-3 text-center border-b border-border">
                        <span className="w-10 h-10 rounded-full bg-accent/15 text-accent-text flex items-center justify-center text-lg mb-1 font-bold">
                          ▶
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-text">Video</span>
                        <span className="text-[10px] text-muted truncate max-w-full px-1 mt-0.5" title={img.image_url}>
                          {img.image_url}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={img.image_url}
                        alt={img.alt_text}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    {img.is_cover && (
                      <span className="absolute top-2 left-2 bg-accent text-accent-text text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                        ★ Portada
                      </span>
                    )}
                    {img.media_type === 'video' && !img.is_cover && (
                      <span className="absolute top-2 left-2 bg-surface text-primary border border-border text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                        ▶ Video
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between gap-2 text-xs">
                    <p className="text-muted truncate font-mono text-[11px]" title={img.alt_text || img.image_url}>
                      {img.alt_text || (img.media_type === 'video' ? 'Video' : 'Sin texto alt')}
                    </p>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-border">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveGalleryImage(index, 'up')}
                          className="p-1 text-muted hover:text-primary disabled:opacity-30 rounded hover:bg-surface-hover transition-colors"
                          title="Mover antes"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          disabled={index === images.length - 1}
                          onClick={() => handleMoveGalleryImage(index, 'down')}
                          className="p-1 text-muted hover:text-primary disabled:opacity-30 rounded hover:bg-surface-hover transition-colors"
                          title="Mover después"
                        >
                          ▶
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {!img.is_cover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(img.id)}
                            className="px-2 py-1 text-[11px] font-medium text-accent-text hover:bg-accent/10 rounded transition-colors"
                            title="Hacer portada principal"
                          >
                            Portada
                          </button>
                        )}
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(img.id)}
                            className="p-1 text-muted hover:text-danger rounded hover:bg-surface-hover transition-colors"
                            title="Eliminar de galería"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        </div>
      )}

      {/* 4. Descripción y Puntos Destacados */}
      <Card
        title="Descripción y Puntos Destacados"
        subtitle={isEs ? 'Explicación detallada y lista de qué incluye' : `Traducción de textos para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-6">
          {/* Introducción (título + texto corto, se muestra entre el hero y la ficha técnica) */}
          {isEs ? (
            <div className="space-y-3 pb-5 border-b border-border">
              <Input
                label="Título de introducción (opcional)"
                value={introTitle}
                onChange={(e) => setIntroTitle(e.target.value)}
                placeholder="Ej: Volá sobre los Pirineos"
                helperText="Se muestra como título grande entre la foto de cabecera y la ficha técnica. Dejalo vacío para no mostrar esta sección."
              />
              <RichTextEditor
                label="Texto de introducción (opcional)"
                value={introText}
                onChange={setIntroText}
                placeholder="Breve presentación de la actividad, antes de la descripción detallada..."
              />
            </div>
          ) : (
            currentNonEs && (
              <div className="space-y-3 pb-5 border-b border-border">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título de introducción en {activeLocale.toUpperCase()}
                    </label>
                    {introTitle && (
                      <AiTranslateButton
                        sourceText={introTitle}
                        targetLocale={activeLocale}
                        fieldName="Título de introducción"
                        onTranslated={(val) => updateTranslationField(currentNonEs, 'intro_title', val)}
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    value={translations[currentNonEs].intro_title}
                    onChange={(e) => updateTranslationField(currentNonEs, 'intro_title', e.target.value)}
                    placeholder={`Título de introducción traducido (${activeLocale.toUpperCase()})...`}
                    className="w-full bg-input border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3.5 py-2 text-sm text-primary placeholder-faint focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Texto de introducción en {activeLocale.toUpperCase()}
                    </label>
                    {introText && (
                      <AiTranslateButton
                        sourceText={introText}
                        targetLocale={activeLocale}
                        fieldName="Texto de introducción"
                        onTranslated={(val) => updateTranslationField(currentNonEs, 'intro_text', val)}
                      />
                    )}
                  </div>
                  <RichTextEditor
                    value={translations[currentNonEs].intro_text}
                    onChange={(val) => updateTranslationField(currentNonEs, 'intro_text', val)}
                    placeholder={`Texto de introducción traducido (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}

          {/* Descripción */}
          {isEs ? (
            <RichTextEditor
              label="Descripción completa (Español - Principal)"
              value={description}
              onChange={setDescription}
              placeholder="Escribe el texto detallado de la ruta, el entorno y los atractivos de esta actividad..."
            />
          ) : (
            currentNonEs && (
              <div className="space-y-3">
                <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
                  <span className="font-semibold text-primary block mb-1">Descripción base en Español:</span>
                  {description ? (
                    <div className="rich-text-content leading-relaxed" dangerouslySetInnerHTML={{ __html: description }} />
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
                      sourceText={description}
                      targetLocale={activeLocale}
                      fieldName="Descripción completa"
                      onTranslated={(val) => updateTranslationField(currentNonEs, 'description', val)}
                    />
                  </div>
                  <RichTextEditor
                    value={translations[currentNonEs].description}
                    onChange={(val) => updateTranslationField(currentNonEs, 'description', val)}
                    placeholder={`Descripción traducida (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}

          {/* Highlights */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                Puntos destacados / Qué incluye {isEs ? '' : `(${activeLocale.toUpperCase()})`}
              </label>
              {isEs && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddHighlight}
                >
                  + Agregar punto
                </Button>
              )}
            </div>

            {isEs ? (
              <div className="space-y-2">
                {highlights.map((h, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => handleHighlightChange(index, e.target.value)}
                      placeholder={`Punto destacado #${index + 1} (ej. Guía certificado AADIDES/ISIA)`}
                      className="flex-1 bg-input border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3.5 py-2 text-sm text-primary placeholder-faint focus:outline-none focus:ring-2"
                    />
                    {highlights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(index)}
                        className="p-2 text-muted hover:text-danger rounded-xl hover:bg-surface-hover transition-colors"
                        title="Eliminar punto"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              currentNonEs && (
                <div className="space-y-4">
                  {highlights.map((baseH, index) => (
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
                            onTranslated={(val) => updateTranslationHighlight(currentNonEs, index, val)}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted italic">Base (ES): {baseH || '(vacío)'}</p>
                      <input
                        type="text"
                        value={translations[currentNonEs].highlights?.[index] || ''}
                        onChange={(e) => updateTranslationHighlight(currentNonEs, index, e.target.value)}
                        placeholder={`Traducción del punto #${index + 1}...`}
                        className="w-full bg-input border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3.5 py-2 text-sm text-primary placeholder-faint focus:outline-none focus:ring-2"
                      />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </Card>

      {/* 5. Publicación y Estado (Solo en ES) */}
      {isEs && (
        <Card title="Estado de Publicación" subtitle="Control de visibilidad en el sitio web">
          <div className="space-y-4">
            <Toggle
              label="Publicado en el sitio web"
              description="Si está activado, la actividad aparecerá de inmediato en los menús y listados públicos."
              checked={published}
              onChange={setPublished}
            />
          </div>
        </Card>
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
          isLoading={isSaving}
        >
          💾 Guardar actividad
        </Button>
      </div>

      {/* Main Image Picker Modal: for a new activity (no gallery yet) we still allow
          picking from the media library / uploading directly. Once the activity exists,
          the main photo must come from its own gallery — see CoverImagePickerModal. */}
      {isEdit ? (
        <CoverImagePickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectImage={handleSelectCoverFromGallery}
          images={images}
          selectedImageUrl={imageUrl}
          onGoToGallery={scrollToGallery}
        />
      ) : (
        <ImagePickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectImage={handleSelectImage}
          selectedImageUrl={imageUrl}
        />
      )}

      {/* Gallery Image Picker Modal */}
      <ImagePickerModal
        isOpen={galleryPickerOpen}
        onClose={() => setGalleryPickerOpen(false)}
        onSelectImage={handleAddGalleryImage}
      />

      {/* Video URL Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                🎥 Agregar Video a la Galería
              </h3>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="text-muted hover:text-primary p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4">
              <Input
                label="URL del Video (YouTube, Vimeo o enlace MP4)"
                value={videoInputUrl}
                onChange={(e) => setVideoInputUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                helperText="Se reproducirá automáticamente en loop y silenciado en el hero del tour."
                required
              />

              <Input
                label="URL de Poster/Miniatura (Opcional)"
                value={videoInputPoster}
                onChange={(e) => setVideoInputPoster(e.target.value)}
                placeholder="https://..."
                helperText="Opcional. Imagen estática antes de que cargue el video."
              />

              <Input
                label="Texto descriptivo / Alt (Opcional)"
                value={videoInputAlt}
                onChange={(e) => setVideoInputAlt(e.target.value)}
                placeholder={`Video de ${title || 'la experiencia'}`}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setVideoModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isVideoSubmitting}
                >
                  Agregar video
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </form>
  );
};
