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
  must_change_password?: boolean;
}

export interface ApiKeyItem {
  key_name: string;
  label: string;
  is_required: boolean;
  is_configured: boolean;
  masked_value: string;
  description: string;
}

export type ApiServiceId = 'nvidia_nim' | 'openai' | 'gemini' | 'anthropic' | 'meta' | 'google_places' | 'tripadvisor' | 'telegram';
export type AiTranslationProvider = 'nvidia_nim' | 'openai' | 'gemini' | 'anthropic';

export interface ApiServiceInfo {
  id: ApiServiceId;
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
  active_translation_provider: AiTranslationProvider;
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

export interface ActivitySocialLink {
  id?: number;
  activity_id?: string;
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
  reference_channels?: string[] | null;
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
  ca?: PackageTranslation;
  en?: PackageTranslation;
  fr?: PackageTranslation;
}

export interface PackageTranslation {
  title: string;
  description: string;
  price_unit?: string;
  intro_title?: string;
  intro_text?: string;
  highlights?: string[];
  itinerary?: string[];
}

export interface PackageMedia {
  id?: number;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string | null;
  alt_text?: string | null;
  display_order?: number;
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
  menu_parent_id?: number | null;
  menu_item_published?: boolean;
  group_label?: string | null;
  group_published?: boolean;
  intro_title?: string | null;
  intro_text?: string | null;
  highlights?: string[];
  itinerary?: string[];
  media?: PackageMedia[];
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
  menu_parent_id?: number | null;
  intro_title?: string | null;
  intro_text?: string | null;
  highlights?: string[];
  itinerary?: string[];
  media?: PackageMedia[];
  translations?: PackageTranslations;
}

export type HealthSeverity = 'green' | 'yellow' | 'red';

export interface ComponentHealth {
  package_name: string;
  description: string;
  declared_version: string;
  installed_version: string;
  latest_version: string;
  severity: HealthSeverity;
  status_text: string;
}

export interface RuntimePhpHealth {
  name: string;
  installed_version: string;
  latest_version: string;
  severity: HealthSeverity;
  status_text: string;
  sapi: string;
  memory_limit: string;
  max_execution_time: string;
  extensions: {
    pdo_mysql: boolean;
    curl: boolean;
    zip: boolean;
    gd: boolean;
    mbstring: boolean;
  };
}

export interface RuntimeMysqlHealth {
  name: string;
  installed_version: string;
  severity: HealthSeverity;
  status_text: string;
  database_name: string;
}

export interface RuntimeServerHealth {
  name: string;
  software: string;
  os: string;
  time: string;
}

export interface SiteHealthRuntime {
  php: RuntimePhpHealth;
  mysql: RuntimeMysqlHealth;
  server: RuntimeServerHealth;
}

export interface SiteHealthDependencies {
  web: ComponentHealth[];
  dashboard: ComponentHealth[];
}

export interface SiteHealthTelegram {
  is_configured: boolean;
  has_bot_token: boolean;
  has_chat_id: boolean;
  masked_token: string;
  chat_id: string;
  alert_triggered: boolean;
}

export interface SiteHealthStatusResponse {
  status: HealthSeverity;
  summary: {
    total_components: number;
    up_to_date_count: number;
    minor_update_count: number;
    major_update_count: number;
  };
  runtime: SiteHealthRuntime;
  dependencies: SiteHealthDependencies;
  telegram: SiteHealthTelegram;
  checked_at: string;
}

export interface BackupItem {
  filename: string;
  size_bytes: number;
  size_human: string;
  created_at: string;
  download_url: string;
}

export interface BackupCreateResponse {
  filename: string;
  size_bytes: number;
  size_human: string;
  created_at: string;
  download_url: string;
}

export interface BackupListResponse {
  backups: BackupItem[];
  total: number;
}

export interface ActivityTypeItem {
  id: number;
  name: string;
  display_order: number;
  activities_count: number;
  created_at?: string;
  updated_at?: string;
}

export type { ActivityImage, Activity, ActivityType } from '../activities/types';
