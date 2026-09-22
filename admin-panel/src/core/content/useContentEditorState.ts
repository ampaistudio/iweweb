import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { MediaItem, DashboardLocale } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { DEFAULT_DIRECT_REVIEWS_JSON, type NonEsLocale, type PickerTarget } from './contentTypes';

export function useContentEditorState() {
  const [activeLocale, setActiveLocale] = useState<DashboardLocale>('es');

  // Base Spanish (ES) form
  const [form, setForm] = useState<Record<string, string>>({
    business_name: '',
    hero_eyebrow: 'Elige tu experiencia con nosotros',
    hero_title_line1: 'Todas las experiencias.',
    hero_title_line2: 'Un solo operador.',
    hero_copy: 'iWE, la agencia líder en turismo de experiencias. Esquí, snowboard, raquetas de nieve, BTT, 4x4, vía ferrata, senderismo y mucho más en Andorra y los Pirineos, todo el año.',
    hero_tagline: 'Fabricamos experiencias.',
    hero_cta_activities: 'Ver actividades',
    hero_cta_reserve: 'Reservar ahora',
    hero_scroll_hint: 'Descubre más',
    mission_eyebrow: 'Nuestra empresa',
    mission_title: 'Líderes en turismo de experiencias en Andorra y los Pirineos.',
    mission_text: 'Descubre un mundo de experiencias únicas con un solo operador turístico...',
    mission_image: 'https://i-wildland.com/wp-content/uploads/2020/04/roc-del-quer-2.jpg',
    mission_team_link: 'Nuestro equipo',
    mission_stat1_value: '2018',
    mission_stat1_label: 'año de fundación',
    mission_stat2_value: '15+',
    mission_stat2_label: 'tipos de actividades',
    mission_stat3_value: '2',
    mission_stat3_label: 'regiones: Andorra y Pirineos',
    team_eyebrow: 'Nuestro equipo',
    team_title: 'Fundada en 2018. Guiada por expertos locales.',
    team_bio: 'iWE nació en 2018 de la mano de Charly Paredes...',
    team_image: 'https://i-wildland.com/wp-content/uploads/2022/07/FSF-49-1024x683-iWE.jpg',
    team_contact_link: 'Cómo trabajamos',
    activities_bike_eyebrow: 'Enduro, E-Bike, BTT y remontes',
    activities_bike_title: 'Bike',
    activities_via_ferrata_eyebrow: 'Iniciación y avanzado',
    activities_via_ferrata_title: 'Vía Ferrata',
    activities_4x4_eyebrow: 'Lagos Off-Road, Tor y Pic Negre',
    activities_4x4_title: '4×4',
    activities_senderismo_eyebrow: 'Medio día y día completo',
    activities_senderismo_title: 'Senderismo',
    activities_esqui_eyebrow: 'Raquetas y esquí tour',
    activities_esqui_title: 'Esquí-Snow',
    calendar_holiday_label: 'Holiday',
    calendar_events_label: 'Eventos',
    calendar_events_name: 'Team Building & Eventos Deportivos',
    calendar_events_place: 'Andorra',
    weather_eyebrow: 'Condiciones en tiempo real',
    weather_title_line1: 'El tiempo en Andorra',
    weather_title_line2: 'y los Pirineos.',
    weather_copy: 'Previsión meteorológica y mapa interactivo de viento en directo para planificar tus salidas de BTT, senderismo o esquí con la máxima seguridad.',
    weather_meta_location: 'Andorra (42.55° N, 1.51° E) • Modelo ECMWF',
    weather_meta_badge: 'Viento & Previsión en vivo',
    reviews_eyebrow: 'Opiniones de clientes',
    reviews_google_published: 'true',
    reviews_tripadvisor_published: 'true',
    reviews_direct_published: 'true',
    reviews_direct_items: DEFAULT_DIRECT_REVIEWS_JSON,
    reviews_tab_all: 'Todas',
    reviews_tab_google: 'Google ★ 4.9',
    reviews_tab_tripadvisor: 'TripAdvisor ★ 5.0',
    reviews_tab_direct: 'iWE',
    newsletter_success_message: 'Ya formas parte de la lista. Nos vemos en la montaña.',
    newsletter_email_label: 'Tu correo electrónico',
    contact_whatsapp_link: 'O escríbenos directamente',
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
    seo_meta_title: 'iWE | Isard Wildland Experience — Turismo Activo y Aventura en Andorra',
    seo_meta_description: 'Descubre experiencias únicas en Andorra y los Pirineos con guías locales certificados: BTT, E-Bike Enduro, Vía Ferrata, 4x4, Senderismo, Esquí Tour y Raquetas de Nieve.',
    seo_keywords: 'Andorra, iWE, BTT Andorra, E-Bike Enduro, Vía Ferrata, 4x4 Andorra, Senderismo Pirineos, Esquí Tour, Charly Paredes, Turismo Activo',
    seo_og_image: '',
    site_url: 'https://i-wildland.com',
    weather_map_lat: '42.5459743',
    weather_map_lon: '1.5140217',
    social_instagram: 'https://www.instagram.com/isardwildland/',
    social_facebook: 'https://www.facebook.com/isardwildland/',
    social_tripadvisor: '',
    social_whatsapp: '',
    social_youtube: '',
    social_tiktok: '',
    social_strava: '',
    social_linkedin: '',
    social_twitter: '',
  });

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

