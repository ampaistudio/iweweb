export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

export interface AuthUser {
  id: number;
  email: string;
  display_name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface ApiKeyItem {
  key_name: string;
  label: string;
  is_required: boolean;
  is_configured: boolean;
  masked_value: string;
  description: string;
}

export interface ApiServiceInfo {
  id: 'nvidia_nim' | 'meta' | 'google_places' | 'tripadvisor';
  title: string;
  description: string;
  docs_url: string;
  keys: ApiKeyItem[];
}

export interface CustomApiKey {
  key_name: string;
  is_configured: boolean;
  masked_value: string;
  description: string;
  updated_at: string;
}

export interface ApiKeysData {
  services: ApiServiceInfo[];
  custom_keys: CustomApiKey[];
  storage_file: string;
  is_writable: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  latency_ms: number;
  message: string;
}

export interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by_name?: string;
  url: string;
}

export interface HeroSlideItem {
  id: number;
  slide_type: 'image' | 'video';
  media_source: 'upload' | 'external_url';
  src: string;
  poster: string | null;
  alt: string;
  display_order: number;
  published: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface SiteContentMap {
  [key: string]: string;
}

export interface SiteContentResponse {
  content: SiteContentMap;
  base?: SiteContentMap;
  translations?: {
    ca?: Record<string, string>;
    en?: Record<string, string>;
    fr?: Record<string, string>;
  };
  raw: Array<{
    content_key: string;
    content_value: string;
    updated_at: string;
  }>;
}

export interface PostSocialLink {
  id?: number;
  post_id?: number;
  platform: 'facebook' | 'instagram';
  external_post_id: string;
  external_permalink: string | null;
  sync_status: 'pending' | 'synced' | 'failed';
  sync_error: string | null;
  synced_at: string | null;
}

export interface PostTranslations {
  ca?: {
    title?: string;
    body?: string;
  };
  en?: {
    title?: string;
    body?: string;
  };
  fr?: {
    title?: string;
    body?: string;
  };
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  body: string;
  cover_media_id: number | null;
  status: 'draft' | 'published';
  origin: 'web' | 'facebook' | 'instagram';
  created_by: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  cover_filename?: string | null;
  cover_image_url?: string | null;
  social_links?: PostSocialLink[];
  translations?: PostTranslations;
}

export interface OverviewData {
  activities: {
    total: number;
    published: number;
    last_edit: {
      title: string;
      updated_at: string;
    } | null;
  };
  posts: {
    total: number;
    published: number;
    last_edit: {
      title: string;
      updated_at: string;
    } | null;
  };
  media: {
    total: number;
  };
}

export type DashboardLocale = 'es' | 'ca' | 'en' | 'fr';

export interface TranslateParams {
  text: string;
  target_locale: 'ca' | 'en' | 'fr';
  source_locale?: 'es';
  field_name?: string;
}

export interface TranslateResponse {
  translated_text: string;
  target_locale: string;
  source_locale: string;
  model: string;
}

export type MenuLinkType = 'route' | 'anchor' | 'activity' | 'package' | 'external';

export interface MenuItemTranslations {
  ca?: { label: string };
  en?: { label: string };
  fr?: { label: string };
}

export interface MenuItem {
  id: number;
  parent_id: number | null;
  label: string;
  link_type: MenuLinkType;
  target_value: string;
  display_order: number;
  published: boolean | number;
  publish_at: string | null;
  unpublish_at: string | null;
  is_currently_visible: boolean;
  children?: MenuItem[];
  translations?: MenuItemTranslations;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemPayload {
  id?: number;
  parent_id?: number | null;
  label: string;
  link_type: MenuLinkType;
  target_value: string;
  display_order?: number;
  published?: boolean | number;
  publish_at?: string | null;
  unpublish_at?: string | null;
  translations?: MenuItemTranslations;
}

export interface PackageTranslations {
  ca?: { title: string; description: string; price_unit?: string };
  en?: { title: string; description: string; price_unit?: string };
  fr?: { title: string; description: string; price_unit?: string };
}

export interface PackageItem {
  id: string;
  title: string;
  duration: string;
  description: string;
  image_url: string | null;
  alt_text: string | null;
  price_amount: number | null;
  price_currency: string;
  price_unit: string | null;
  display_order: number;
  published: boolean | number;
  publish_at: string | null;
  unpublish_at: string | null;
  is_currently_visible: boolean;
  translations?: PackageTranslations;
  created_at?: string;
  updated_at?: string;
}

export interface PackagePayload {
  id?: string;
  title: string;
  duration: string;
  description: string;
  image_url?: string | null;
  alt_text?: string | null;
  price_amount?: number | null;
  price_currency?: string;
  price_unit?: string | null;
  display_order?: number;
  published?: boolean | number;
  publish_at?: string | null;
  unpublish_at?: string | null;
  translations?: PackageTranslations;
}

export type { ActivityImage, Activity, ActivityType } from '../activities/types';

