import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { activities as staticActivities, type Activity, type ActivityType } from '../data/activities';
import { publicApi } from '../api/client';
import type { RawApiActivity, SiteContentMap } from '../api/types';
import { resolveMediaUrl } from '../utils/media';
import { usePreferences } from './PreferencesContext';

export interface NavSection {
  label: string;
  anchor: string;
  items: Array<{ title: string; id: string }>;
}

export const DEFAULT_SITE_CONTENT: SiteContentMap = {
  business_name: 'Isard Wildland Experience',
  hero_tagline: 'Fabricamos experiencias.',
  mission_eyebrow: 'Nuestra empresa',
  mission_title: 'Líderes en turismo de experiencias en Andorra y los Pirineos.',
  mission_text:
    'Descubre un mundo de experiencias únicas con un solo operador turístico. Esquí, snowboard, raquetas de nieve, tours culturales y todo lo que te puedas imaginar para vivir la montaña, guiado por expertos locales como Charly Paredes.',
  team_eyebrow: 'Nuestro equipo',
  team_title: 'Fundada en 2018. Guiada por expertos locales.',
  team_bio:
    'iWE nació en 2018 de la mano de Charly Paredes, guía de montaña nivel 2 (EFPEM Andorra), instructor de esquí certificado por AADIDES/ISIA y miembro de UIMLA y AGAMA. Formado entre Ushuaia y Andorra, habla catalán, español, francés e inglés. Cada ruta está pensada para adaptarse a tu nivel físico y técnico, sea que viajes en familia, en pareja o con amigos. Tú pones la curiosidad. Nosotros nos ocupamos del resto.',
  contact_phone: '+376 344 870',
  contact_email: 'info@i-wildland.com',
  contact_address: 'AD100 Canillo, Principat d\'Andorra',
};

function buildNavSections(actList: Activity[]): NavSection[] {
  return [
    {
      label: 'Nuestra empresa',
      anchor: '/#mission',
      items: [
        { title: 'Nuestra empresa', id: 'mission' },
        { title: 'Nuestro equipo', id: 'team' },
      ],
    },
    {
      label: 'Bike',
      anchor: '/#bike',
      items: actList
        .filter((activity) => activity.type === 'BTT')
        .map((activity) => ({ title: activity.title, id: activity.id })),
    },
    {
      label: 'Vía Ferrata',
      anchor: '/#via-ferrata',
      items: actList
        .filter((activity) => activity.type === 'Vía Ferrata')
        .map((activity) => ({ title: activity.title, id: activity.id })),
    },
    {
      label: '4×4',
      anchor: '/#4x4',
      items: actList
        .filter((activity) => activity.type === '4x4')
        .map((activity) => ({ title: activity.title, id: activity.id })),
    },
    {
      label: 'Senderismo',
      anchor: '/#senderismo',
      items: actList
        .filter((activity) => activity.type === 'Senderismo')
        .map((activity) => ({ title: activity.title, id: activity.id })),
    },
    {
      label: 'Esquí-Snow',
      anchor: '/#esqui-snow',
      items: actList
        .filter((activity) => activity.type === 'Esquí-Snow')
        .map((activity) => ({ title: activity.title, id: activity.id })),
    },
  ];
}

function normalizeRawActivity(raw: RawApiActivity): Activity {
  const imageUrl = raw.image || raw.image_url || '';
  const altText = raw.alt || raw.alt_text || raw.title;

  return {
    id: raw.id,
    title: raw.title,
    region: raw.region,
    country: raw.country,
    type: raw.type as ActivityType,
    level: raw.level,
    duration: raw.duration,
    image: resolveMediaUrl(imageUrl, staticActivities.find((a) => a.id === raw.id)?.image || ''),
    alt: altText,
    price: raw.price || undefined,
    description: raw.description,
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
  };
}

interface SiteDataContextValue {
  activities: Activity[];
  content: SiteContentMap;
  navSections: NavSection[];
  loading: boolean;
  isActivitiesFallback: boolean;
  isContentFallback: boolean;
  getActivity: (id: string) => Activity | undefined;
  getContent: (key: string, fallback?: string) => string;
}

const SiteDataContext = createContext<SiteDataContextValue | undefined>(undefined);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { language } = usePreferences();
  const [activities, setActivities] = useState<Activity[]>(staticActivities);
  const [content, setContent] = useState<SiteContentMap>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [isActivitiesFallback, setIsActivitiesFallback] = useState(false);
  const [isContentFallback, setIsContentFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. Fetch activities with resilient fallback passing selected language
      try {
        const rawActivities = await publicApi.activities.list({ locale: language });
        if (isMounted && Array.isArray(rawActivities) && rawActivities.length > 0) {
          const normalized = rawActivities.map(normalizeRawActivity);
          setActivities(normalized);
          setIsActivitiesFallback(false);
        }
      } catch {
        if (isMounted) {
          // Transparent fallback to static activities
          setActivities(staticActivities);
          setIsActivitiesFallback(true);
        }
      }

      // 2. Fetch institutional content with resilient fallback passing selected language
      try {
        const contentRes = await publicApi.content.get(language);
        if (isMounted && contentRes?.content) {
          setContent({
            ...DEFAULT_SITE_CONTENT,
            ...contentRes.content,
          });
          setIsContentFallback(false);
        }
      } catch {
        if (isMounted) {
          // Transparent fallback to default content
          setContent(DEFAULT_SITE_CONTENT);
          setIsContentFallback(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [language]);

  const navSections = buildNavSections(activities);

  const getActivity = (id: string): Activity | undefined => {
    return activities.find((item) => item.id === id) || staticActivities.find((item) => item.id === id);
  };

  const getContent = (key: string, fallback: string = ''): string => {
    return content[key] || DEFAULT_SITE_CONTENT[key] || fallback;
  };

  return (
    <SiteDataContext.Provider
      value={{
        activities,
        content,
        navSections,
        loading,
        isActivitiesFallback,
        isContentFallback,
        getActivity,
        getContent,
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData(): SiteDataContextValue {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error('useSiteData must be used within a SiteDataProvider');
  }
  return context;
}
