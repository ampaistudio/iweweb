import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Activity, ActivityType } from '../data/activities';
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

function resolveHref(linkType: string, targetValue: string): string {
  if (linkType === 'activity') {
    return `/tour/${targetValue}`;
  }
  if (linkType === 'package') {
    return '/#tours';
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
          id: String(grandchild.id),
          href: resolveHref(grandchild.link_type, grandchild.target_value),
        })),
      };
    }
    return {
      title: child.label,
      id: String(child.id),
      href: resolveHref(child.link_type, child.target_value),
    };
  });
}

function transformMenuTree(menuTree: MenuItem[], siteContent: SiteContentMap): NavSection[] {
  const toursHidden = ['false', '0'].includes(siteContent.tours_section_published);
  return menuTree.filter((rootNode) => !(toursHidden && rootNode.target_value === '/#tours')).map((rootNode) => ({
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
    image: resolveMediaUrl(imageUrl),
    alt: altText,
    price: raw.price || undefined,
    description: raw.description,
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    images: normalizedImages,
  };
}

interface SiteDataContextValue {
  activities: Activity[];
  categories: string[];
  content: SiteContentMap;
  heroSlides: HeroSlide[];
  navSections: NavSection[];
  loading: boolean;
  isActivitiesFallback: boolean;
  isContentFallback: boolean;
  isHeroSlidesFallback: boolean;
  isMenuFallback: boolean;
  getActivity: (id: string) => Activity | undefined;
  getContent: (key: string) => string;
}

const SiteDataContext = createContext<SiteDataContextValue | undefined>(undefined);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { language } = usePreferences();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [content, setContent] = useState<SiteContentMap>({});
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [navSections, setNavSections] = useState<NavSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActivitiesFallback, setIsActivitiesFallback] = useState(false);
  const [isContentFallback, setIsContentFallback] = useState(false);
  const [isHeroSlidesFallback, setIsHeroSlidesFallback] = useState(false);
  const [isMenuFallback, setIsMenuFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 0. Fetch activity categories dynamically from DB
      try {
        const rawTypes = await publicApi.activityTypes.list();
        if (isMounted && Array.isArray(rawTypes) && rawTypes.length > 0) {
          setCategories(rawTypes.map((t) => t.name));
        }
      } catch {
        // Transparent empty fallback
      }

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
          setActivities([]);
          setIsActivitiesFallback(true);
        }
      }

      // 2. Fetch institutional content with resilient fallback passing selected language
      let loadedContent: SiteContentMap = {};
      try {
        const contentRes = await publicApi.content.get(language);
        if (isMounted && contentRes?.content) {
          loadedContent = contentRes.content;
          setContent(contentRes.content);
          setIsContentFallback(false);
        }
      } catch {
        if (isMounted) {
          setContent({});
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
          setHeroSlides([]);
          setIsHeroSlidesFallback(true);
        }
      }

      // 4. Fetch navigation menu with resilient fallback passing selected language
      try {
        const rawMenu = await publicApi.menu.list({ locale: language });
        if (isMounted && Array.isArray(rawMenu) && rawMenu.length > 0) {
          const transformed = transformMenuTree(rawMenu, loadedContent);
          setNavSections(transformed);
          setIsMenuFallback(false);
        }
      } catch {
        if (isMounted) {
          setNavSections([]);
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
    return activities.find((item) => item.id === id);
  };

  const getContent = (key: string): string => content[key] ?? '';

  return (
    <SiteDataContext.Provider
      value={{
        activities,
        categories,
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
