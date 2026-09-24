export type ActivityType = string;

export interface LocaleActivityTranslation {
  title?: string;
  description?: string;
  intro_title?: string;
  intro_text?: string;
  region?: string;
  duration?: string;
  level?: string;
  country?: string;
  alt_text?: string;
  highlights?: string[];
}

export interface ActivityTranslations {
  ca?: LocaleActivityTranslation;
  en?: LocaleActivityTranslation;
  fr?: LocaleActivityTranslation;
}

export interface ActivityImage {
  id: number;
  activity_id: string;
  image_url: string;
  media_type?: 'image' | 'video';
  poster_url?: string;
  alt_text: string;
  display_order: number;
  is_cover: boolean;
  created_at?: string;
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

export interface Activity {
  id: string;
  title: string;
  region: string;
  country: string;
  type: ActivityType;
  level: string;
  duration: string;
  image: string;
  image_url?: string;
  alt: string;
  alt_text?: string;
  price?: string | null;
  description: string;
  intro_title?: string | null;
  intro_text?: string | null;
  highlights: string[];
  display_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
  translations?: ActivityTranslations;
  images?: ActivityImage[];
  social_links?: ActivitySocialLink[];
}
