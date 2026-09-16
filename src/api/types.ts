import type { Activity, ActivityType } from '../data/activities';

export type { Activity, ActivityType };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

export interface SiteContentMap {
  [key: string]: string;
}

export interface SiteContentResponse {
  content: SiteContentMap;
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
}

export interface RawApiActivity {
  id: string;
  title: string;
  region: string;
  country: string;
  type: ActivityType;
  level: string;
  duration: string;
  image?: string;
  image_url?: string;
  alt?: string;
  alt_text?: string;
  price?: string | null;
  description: string;
  highlights?: string[];
  display_order?: number;
  published?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

