import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { type Activity, type ActivityType, type ActivitySocialLink } from './types';
import type { MediaItem, DashboardLocale } from '../api/types';
import { useToast } from '../core/ui/ToastContext';
import type { LocaleActivityData } from './ActivityTranslationsSection';
import { useActivityGallery } from './useActivityGallery';

type NonEsLocale = 'ca' | 'en' | 'fr';

export function useActivityEditorState() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const [searchParams] = useSearchParams();
  const [addToMenuOpen, setAddToMenuOpen] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('promptMenu') === '1') {
      setAddToMenuOpen(true);
    }
  }, [id, searchParams]);

  const [activeLocale, setActiveLocale] = useState<DashboardLocale>('es');

  // Base Spanish (ES) state
  const [title, setTitle] = useState('');
  const [slugId, setSlugId] = useState('');
  const [type, setType] = useState<ActivityType>('BTT');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
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

  // Gallery hook
  const gallery = useActivityGallery(id, isEdit, title, setImageUrl, setAltText);

  // Social sharing state (Meta Graph API)
  const [publishToFacebook, setPublishToFacebook] = useState(false);
  const [publishToInstagram, setPublishToInstagram] = useState(false);
  const [socialLinks, setSocialLinks] = useState<ActivitySocialLink[]>([]);
  const [isSharingSocial, setIsSharingSocial] = useState(false);

  // Translations (CA, EN, FR)
  const [translations, setTranslations] = useState<Record<NonEsLocale, LocaleActivityData>>({
    ca: { title: '', description: '', intro_title: '', intro_text: '', region: '', country: '', level: '', duration: '', alt_text: '', highlights: [] },
    en: { title: '', description: '', intro_title: '', intro_text: '', region: '', country: '', level: '', duration: '', alt_text: '', highlights: [] },
    fr: { title: '', description: '', intro_title: '', intro_text: '', region: '', country: '', level: '', duration: '', alt_text: '', highlights: [] },
  });

  const [loading, setLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await api.activityTypes.list();
        if (cats && cats.length > 0) {
          setAvailableCategories(cats.map((c) => c.name));
        }
      } catch {
        // Fallback to default categories
      }
    };
    loadCategories();
  }, []);

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
            gallery.setImages(act.images);
          }

          if (act.social_links) {
            setSocialLinks(act.social_links);
          }

          if (act.translations) {
            setTranslations({
              ca: {
                title: act.translations.ca?.title || '',
                description: act.translations.ca?.description || '',
                intro_title: act.translations.ca?.intro_title || '',
                intro_text: act.translations.ca?.intro_text || '',
                region: act.translations.ca?.region || '',
                country: act.translations.ca?.country || '',
                level: act.translations.ca?.level || '',
                duration: act.translations.ca?.duration || '',
                alt_text: act.translations.ca?.alt_text || '',
                highlights: act.translations.ca?.highlights || [],
              },
              en: {
                title: act.translations.en?.title || '',
                description: act.translations.en?.description || '',
                intro_title: act.translations.en?.intro_title || '',
                intro_text: act.translations.en?.intro_text || '',
                region: act.translations.en?.region || '',
                country: act.translations.en?.country || '',
                level: act.translations.en?.level || '',
                duration: act.translations.en?.duration || '',
                alt_text: act.translations.en?.alt_text || '',
                highlights: act.translations.en?.highlights || [],
              },
              fr: {
                title: act.translations.fr?.title || '',
                description: act.translations.fr?.description || '',
                intro_title: act.translations.fr?.intro_title || '',
                intro_text: act.translations.fr?.intro_text || '',
                region: act.translations.fr?.region || '',
                country: act.translations.fr?.country || '',
                level: act.translations.fr?.level || '',
                duration: act.translations.fr?.duration || '',
                alt_text: act.translations.fr?.alt_text || '',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

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

  const updateTranslationField = (
    locale: NonEsLocale,
    field: 'title' | 'description' | 'intro_title' | 'intro_text' | 'region' | 'country' | 'level' | 'duration' | 'alt_text',
    val: string
  ) => {
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
    return Boolean(
      t?.title?.trim() ||
      t?.description?.trim() ||
      t?.intro_title?.trim() ||
      t?.intro_text?.trim() ||
      t?.region?.trim() ||
      t?.country?.trim() ||
      t?.level?.trim() ||
      t?.duration?.trim() ||
      t?.alt_text?.trim() ||
      t?.highlights?.some((h) => h.trim())
    );
  };

  const handleManualSocialShare = async () => {
    if (!id || (!publishToFacebook && !publishToInstagram)) {
      toast.error('Selecciona al menos una red social (Facebook o Instagram).');
      return;
    }
    try {
      setIsSharingSocial(true);
      await api.activities.shareSocial(id, {
        publish_to_facebook: publishToFacebook,
        publish_to_instagram: publishToInstagram,
      });
      toast.success('Publicación enviada a Meta Graph API.');
      const updatedAct = (await api.activities.get(id)) as Activity;
      if (updatedAct.social_links) {
        setSocialLinks(updatedAct.social_links);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al compartir en redes sociales';
      toast.error(msg);
    } finally {
      setIsSharingSocial(false);
    }
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
        publish_to_facebook: publishToFacebook,
        publish_to_instagram: publishToInstagram,
        translations,
      };

      if (isEdit && id) {
        await api.activities.update(id, payload);
        toast.success(`Actividad '${title}' actualizada con éxito.`, 'Guardado');
        navigate('/activities');
      } else {
        const created = await api.activities.create(payload);
        toast.success(`Actividad '${title}' creada con éxito.`, 'Actividad creada');
        setNewlyCreatedId(created.id);
        setAddToMenuOpen(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la actividad';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    id,
    isEdit,
    addToMenuOpen,
    setAddToMenuOpen,
    newlyCreatedId,
    activeLocale,
    setActiveLocale,
    title,
    setTitle,
    slugId,
    setSlugId,
    type,
    setType,
    availableCategories,
    setAvailableCategories,
    categoryModalOpen,
    setCategoryModalOpen,
    region,
    setRegion,
    country,
    setCountry,
    level,
    setLevel,
    duration,
    setDuration,
    price,
    setPrice,
    imageUrl,
    setImageUrl,
    altText,
    setAltText,
    description,
    setDescription,
    introTitle,
    setIntroTitle,
    introText,
    setIntroText,
    highlights,
    setHighlights,
    published,
    setPublished,
    displayOrder,
    setDisplayOrder,
    images: gallery.images,
    setImages: gallery.setImages,
    galleryPickerOpen: gallery.galleryPickerOpen,
    setGalleryPickerOpen: gallery.setGalleryPickerOpen,
    isGalleryLoading: gallery.isGalleryLoading,
    videoModalOpen: gallery.videoModalOpen,
    setVideoModalOpen: gallery.setVideoModalOpen,
    videoInputUrl: gallery.videoInputUrl,
    setVideoInputUrl: gallery.setVideoInputUrl,
    videoInputPoster: gallery.videoInputPoster,
    setVideoInputPoster: gallery.setVideoInputPoster,
    videoInputAlt: gallery.videoInputAlt,
    setVideoInputAlt: gallery.setVideoInputAlt,
    isVideoSubmitting: gallery.isVideoSubmitting,
    publishToFacebook,
    setPublishToFacebook,
    publishToInstagram,
    setPublishToInstagram,
    socialLinks,
    isSharingSocial,
    translations,
    loading,
    isSaving,
    pickerOpen,
    setPickerOpen,
    galleryCardRef: gallery.galleryCardRef,
    handleTitleChange,
    handleSelectImage,
    handleSelectCoverFromGallery: gallery.handleSelectCoverFromGallery,
    scrollToGallery: gallery.scrollToGallery,
    handleAddGalleryImage: gallery.handleAddGalleryImage,
    handleSetCover: gallery.handleSetCover,
    handleRemoveGalleryImage: gallery.handleRemoveGalleryImage,
    handleMoveGalleryImage: gallery.handleMoveGalleryImage,
    handleAddVideo: gallery.handleAddVideo,
    handleAddHighlight,
    handleHighlightChange,
    handleRemoveHighlight,
    updateTranslationField,
    updateTranslationHighlight,
    hasTranslationForLocale,
    handleManualSocialShare,
    handleSubmit,
    navigate,
  };
}

