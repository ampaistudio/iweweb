import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Activity, ActivityType } from '../data/activities';
import { publicApi } from '../api/client';
import type { RawApiActivity, SiteContentMap, MenuItem, ActivityTypeItem } from '../api/types';
import type { HeroSlide } from '../components/HeroSlideshow';
import { resolveMediaUrl } from '../utils/media';
import { usePreferences } from './PreferencesContext';

export interface NavItem {
  label: string;
  id: string;
  href: string;
  children: NavItem[];
}

export interface NavSection {
  id: string;
  label: string;
  anchor: string;
  items: NavItem[];
}

function resolveHref(linkType: string, targetValue: string): string {
  if (linkType === 'activity') {
    return `/tour/${targetValue}`;
  }
  if (linkType === 'package') {
    return `/paquete/${encodeURIComponent(targetValue)}`;
  }
  return targetValue;
}

function buildNavItems(children?: MenuItem[]): NavItem[] {
  if (!children || children.length === 0) return [];

  return children.map((child): NavItem => ({
      label: child.label,
      id: String(child.id),
      href: resolveHref(child.link_type, child.target_value),
      children: buildNavItems(child.children),
    }));
}

function transformMenuTree(menuTree: MenuItem[], siteContent: SiteContentMap): NavSection[] {
  const toursHidden = ['false', '0'].includes(siteContent.tours_section_published);
  return menuTree.map((rootNode) => {
    const hasPackages = rootNode.children?.length && rootNode.children.every((child) => child.link_type === 'package');
    const fallbackAnchor = toursHidden && rootNode.target_value === '/#tours'
      ? rootNode.children?.find((child) => child.target_value !== '/#tours')?.target_value
      : undefined;

    return {
      id: String(rootNode.id),
      label: rootNode.label,
      anchor: hasPackages ? `/#packages-${rootNode.id}` : fallbackAnchor || rootNode.target_value,
      items: buildNavItems(rootNode.children),
    };
  });
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
  categoryItems: ActivityTypeItem[];
  content: SiteContentMap;
  heroSlides: HeroSlide[];
  navSections: NavSection[];
  loading: boolean;
  isActivitiesFallback: boolean;
  isContentFallback: boolean;
  isHeroSlidesFallback: boolean;
  isMenuFallback: boolean;
  loadErrors: string[];
  retryLoad: () => void;
  getActivity: (id: string) => Activity | undefined;
  getContent: (key: string) => string;
}

const SiteDataContext = createContext<SiteDataContextValue | undefined>(undefined);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { language } = usePreferences();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryItems, setCategoryItems] = useState<ActivityTypeItem[]>([]);
  const [content, setContent] = useState<SiteContentMap>({});
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [navSections, setNavSections] = useState<NavSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActivitiesFallback, setIsActivitiesFallback] = useState(false);
  const [isContentFallback, setIsContentFallback] = useState(false);
  const [isHeroSlidesFallback, setIsHeroSlidesFallback] = useState(false);
  const [isMenuFallback, setIsMenuFallback] = useState(false);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setActivities([]);
    setCategories([]);
    setCategoryItems([]);
    setContent({});
    setHeroSlides([]);
    setNavSections([]);
    setLoadErrors([]);

    async function loadData() {
      const [typesResult, activitiesResult, contentResult, slidesResult, menuResult] = await Promise.allSettled([
        publicApi.activityTypes.list(),
        publicApi.activities.list({ locale: language }),
        publicApi.content.get(language),
        publicApi.heroSlides.list(),
        publicApi.menu.list({ locale: language }),
      ]);
      if (!isMounted) return;

      const typesOk = typesResult.status === 'fulfilled' && Array.isArray(typesResult.value);
      const activitiesOk = activitiesResult.status === 'fulfilled' && Array.isArray(activitiesResult.value);
      const contentOk = contentResult.status === 'fulfilled' && contentResult.value?.content !== null
        && typeof contentResult.value?.content === 'object';
      const slidesOk = slidesResult.status === 'fulfilled' && Array.isArray(slidesResult.value);
      const menuOk = menuResult.status === 'fulfilled' && Array.isArray(menuResult.value);

      const types = typesOk ? typesResult.value : [];
      const loadedContent: SiteContentMap = contentOk ? contentResult.value.content : {};
      setCategories(types.map((item) => item.name));
      setCategoryItems(types);
      setActivities(activitiesOk ? activitiesResult.value.map(normalizeRawActivity) : []);
      setContent(loadedContent);
      setHeroSlides(slidesOk ? slidesResult.value.map((slide): HeroSlide => ({
        type: slide.slide_type === 'video' ? 'video' : 'image',
        src: resolveMediaUrl(slide.src),
        poster: slide.poster ? resolveMediaUrl(slide.poster) : undefined,
        alt: slide.alt,
      })) : []);
      setNavSections(menuOk ? transformMenuTree(menuResult.value, loadedContent) : []);
      setIsActivitiesFallback(!activitiesOk);
      setIsContentFallback(!contentOk);
      setIsHeroSlidesFallback(!slidesOk);
      setIsMenuFallback(!menuOk);
      setLoadErrors([
        ...(!typesOk ? ['categories'] : []),
        ...(!activitiesOk ? ['activities'] : []),
        ...(!contentOk ? ['content'] : []),
        ...(!slidesOk ? ['slides'] : []),
        ...(!menuOk ? ['menu'] : []),
      ]);
      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [language, loadAttempt]);

  const getActivity = (id: string): Activity | undefined => {
    return activities.find((item) => item.id === id);
  };

  const getContent = (key: string): string => content[key] ?? '';

  return (
    <SiteDataContext.Provider
      value={{
        activities,
        categories,
        categoryItems,
        content,
        heroSlides,
        navSections,
        loading,
        isActivitiesFallback,
        isContentFallback,
        isHeroSlidesFallback,
        isMenuFallback,
        loadErrors,
        retryLoad: () => setLoadAttempt((attempt) => attempt + 1),
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
