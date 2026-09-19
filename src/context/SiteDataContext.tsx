import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { activities as staticActivities, type Activity, type ActivityType } from '../data/activities';
import { publicApi } from '../api/client';
import type { RawApiActivity, SiteContentMap, MenuItem } from '../api/types';
import type { HeroSlide } from '../components/HeroSlideshow';
import { resolveMediaUrl } from '../utils/media';
import { usePreferences } from './PreferencesContext';

export interface NavLeaf {
  title: string;
  id: string;
  href: string;
}

export interface NavGroup {
  label: string;
  items: NavLeaf[];
}

export type NavItemOrGroup = NavLeaf | NavGroup;

export interface NavSection {
  label: string;
  anchor: string;
  items: NavItemOrGroup[];
}

export function isNavGroup(item: NavItemOrGroup): item is NavGroup {
  return 'items' in item;
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    type: 'image',
    src: 'https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg',
    alt: 'Guía de montaña de iWE en los Pirineos de Andorra',
  },
  {
    type: 'image',
    src: 'https://privateyachtexpeditions.com/wp-content/uploads/2024/01/IMG-20210729-WA0058-605x605.jpg',
    alt: 'E-Bike Enduro en Forn de Canillo',
  },
  {
    type: 'image',
    src: 'https://i-wildland.com/wp-content/uploads/2020/05/IMG_20180724_171459-800x533.jpg',
    alt: 'Excursión 4x4 en la ruta de los contrabandistas hacia Tor',
  },
];

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
  social_instagram: 'https://www.instagram.com/isardwildland/',
  social_facebook: 'https://www.facebook.com/isardwildland/',
  social_youtube: '',
  social_tiktok: '',
  social_tripadvisor: 'https://www.tripadvisor.com/',
  social_strava: '',
  tours_section_published: 'true',
  tours_eyebrow: 'Tours en Andorra',
  tours_title_line1: 'Vacaciones',
  tours_title_line2: 'completas con iWE.',
  tours_copy:
    'Combina alojamiento, guías y actividades en un solo paquete. Ideal para grupos, familias y viajes de aventura sin preocuparte por la logística.',
  tours_cta_text: 'Consultar disponibilidad',
};

export const FALLBACK_NAV_SECTIONS: NavSection[] = [
  {
    label: 'Nuestra empresa',
    anchor: '/#mission',
    items: [
      { title: 'Nuestra empresa', id: 'mission', href: '/#mission' },
      { title: 'Nuestro equipo', id: 'team', href: '/#team' },
    ],
  },
  {
    label: 'Bike',
    anchor: '/#bike',
    items: staticActivities
      .filter((activity) => activity.type === 'BTT')
      .map((activity) => ({ title: activity.title, id: activity.id, href: `/tour/${activity.id}` })),
  },
  {
    label: 'Vía Ferrata',
    anchor: '/#via-ferrata',
    items: staticActivities
      .filter((activity) => activity.type === 'Vía Ferrata')
      .map((activity) => ({ title: activity.title, id: activity.id, href: `/tour/${activity.id}` })),
  },
  {
    label: '4×4',
    anchor: '/#4x4',
    items: staticActivities
      .filter((activity) => activity.type === '4x4')
      .map((activity) => ({ title: activity.title, id: activity.id, href: `/tour/${activity.id}` })),
  },
  {
    label: 'Senderismo',
    anchor: '/#senderismo',
    items: staticActivities
      .filter((activity) => activity.type === 'Senderismo')
      .map((activity) => ({ title: activity.title, id: activity.id, href: `/tour/${activity.id}` })),
  },
  {
    label: 'Esquí-Snow',
    anchor: '/#esqui-snow',
    items: staticActivities
      .filter((activity) => activity.type === 'Esquí-Snow')
      .map((activity) => ({ title: activity.title, id: activity.id, href: `/tour/${activity.id}` })),
  },
];

function resolveHref(linkType: string, targetValue: string): string {
  if (linkType === 'activity') {
    return `/tour/${targetValue}`;
  }
  if (linkType === 'package') {
    return '/#holiday';
  }
  return targetValue;
}

function buildNavItems(children?: MenuItem[]): NavItemOrGroup[] {
  if (!children || children.length === 0) return [];

  return children.map((child): NavItemOrGroup => {
    if (child.children && child.children.length > 0) {
      return {
        label: child.label,
        items: child.children.map((grandchild) => ({
          title: grandchild.label,
          id: grandchild.target_value,
          href: resolveHref(grandchild.link_type, grandchild.target_value),
        })),
      };
    }
    return {
      title: child.label,
      id: child.target_value,
      href: resolveHref(child.link_type, child.target_value),
    };
  });
}

function transformMenuTree(menuTree: MenuItem[]): NavSection[] {
  return menuTree.map((rootNode) => ({
    label: rootNode.label,
    anchor: rootNode.target_value,
    items: buildNavItems(rootNode.children),
  }));
}



function normalizeRawActivity(raw: RawApiActivity): Activity {
  const imageUrl = raw.image || raw.image_url || '';
  const altText = raw.alt || raw.alt_text || raw.title;

  const normalizedImages = Array.isArray(raw.images)
    ? raw.images.map((img) => ({
        ...img,
        image_url: resolveMediaUrl(img.image_url),
      }))
    : undefined;

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
    images: normalizedImages,
  };
}

interface SiteDataContextValue {
  activities: Activity[];
  content: SiteContentMap;
  heroSlides: HeroSlide[];
  navSections: NavSection[];
  loading: boolean;
  isActivitiesFallback: boolean;
  isContentFallback: boolean;
  isHeroSlidesFallback: boolean;
  isMenuFallback: boolean;
  getActivity: (id: string) => Activity | undefined;
  getContent: (key: string, fallback?: string) => string;
}

const SiteDataContext = createContext<SiteDataContextValue | undefined>(undefined);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { language } = usePreferences();
  const [activities, setActivities] = useState<Activity[]>(staticActivities);
  const [content, setContent] = useState<SiteContentMap>(DEFAULT_SITE_CONTENT);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [navSections, setNavSections] = useState<NavSection[]>(FALLBACK_NAV_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [isActivitiesFallback, setIsActivitiesFallback] = useState(false);
  const [isContentFallback, setIsContentFallback] = useState(false);
  const [isHeroSlidesFallback, setIsHeroSlidesFallback] = useState(false);
  const [isMenuFallback, setIsMenuFallback] = useState(false);

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
      }

      // 3. Fetch hero slides with resilient fallback
      try {
        const rawSlides = await publicApi.heroSlides.list();
        if (isMounted && Array.isArray(rawSlides) && rawSlides.length > 0) {
          const normalized: HeroSlide[] = rawSlides.map((s) => {
            const resolvedSrc = resolveMediaUrl(s.src);
            const resolvedPoster = s.poster ? resolveMediaUrl(s.poster) : undefined;
            if (s.slide_type === 'video') {
              return {
                type: 'video',
                src: resolvedSrc,
                poster: resolvedPoster,
                alt: s.alt,
              };
            }
            return {
              type: 'image',
              src: resolvedSrc,
              alt: s.alt,
            };
          });
          setHeroSlides(normalized);
          setIsHeroSlidesFallback(false);
        }
      } catch {
        if (isMounted) {
          setHeroSlides(DEFAULT_HERO_SLIDES);
          setIsHeroSlidesFallback(true);
        }
      }

      // 4. Fetch navigation menu with resilient fallback passing selected language
      try {
        const rawMenu = await publicApi.menu.list({ locale: language });
        if (isMounted && Array.isArray(rawMenu) && rawMenu.length > 0) {
          const transformed = transformMenuTree(rawMenu);
          setNavSections(transformed);
          setIsMenuFallback(false);
        }
      } catch {
        if (isMounted) {
          setNavSections(FALLBACK_NAV_SECTIONS);
          setIsMenuFallback(true);
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
        heroSlides,
        navSections,
        loading,
        isActivitiesFallback,
        isContentFallback,
        isHeroSlidesFallback,
        isMenuFallback,
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
