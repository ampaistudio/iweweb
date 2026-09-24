import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { MediaItem, DashboardLocale } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { type NonEsLocale, type PickerTarget } from './contentTypes';

export function useContentEditorState() {
  const [activeLocale, setActiveLocale] = useState<DashboardLocale>('es');

  const [form, setForm] = useState<Record<string, string>>({});

  // Translations (CA, EN, FR)
  const [translations, setTranslations] = useState<Record<NonEsLocale, Record<string, string>>>({
    ca: {},
    en: {},
    fr: {},
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const toast = useToast();

  const handleSelectMedia = (item: MediaItem) => {
    if (pickerTarget === 'logo') {
      handleChange('logo_url', item.url);
      toast.success(`Logo '${item.original_name}' asignado.`);
    } else if (pickerTarget === 'og_image') {
      handleChange('seo_og_image', item.url);
      toast.success(`Imagen SEO '${item.original_name}' asignada.`);
    } else if (pickerTarget === 'mission_image') {
      handleChange('mission_image', item.url);
      toast.success(`Imagen de Sobre Nosotros '${item.original_name}' asignada.`);
    } else if (pickerTarget === 'team_image') {
      handleChange('team_image', item.url);
      toast.success(`Imagen de Nuestro Equipo '${item.original_name}' asignada.`);
    }
    setPickerTarget(null);
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await api.content.list();
      if (res) {
        if (res.base || res.content) {
          setForm(res.base || res.content);
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

  return {
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
  };
}

