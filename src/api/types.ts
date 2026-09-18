import type { Activity, ActivityType, ActivityImage } from '../data/activities';

export type { Activity, ActivityType, ActivityImage };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

export interface ApiHeroSlide {
  id: number;
  slide_type: 'image' | 'video';
  media_source: 'upload' | 'external_url';
  src: string;
  poster?: string | null;
  alt: string;
  display_order: number;
  published: boolean | number;
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
  images?: ActivityImage[];
  display_order?: number;
  published?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GoogleReviewsResponse {
  source: 'google';
  is_mock: boolean;
  rating: number;
  user_ratings_total: number;
  place_name?: string;
  place_id?: string;
  cid?: string;
  reviews: GoogleReview[];
}

export interface TripAdvisorReview {
  id: string | number;
  rating: number;
  title: string;
  text: string;
  published_date: string;
  user?: {
    username: string;
    user_location?: {
      name?: string;
    };
    avatar?: string;
  };
  subratings?: Record<string, number>;
}

export interface TripAdvisorReviewsResponse {
  source: 'tripadvisor';
  is_mock: boolean;
  rating: number;
  num_reviews?: number;
  location_id?: string;
  location_name?: string;
  reviews: TripAdvisorReview[];
}

export interface UnifiedReview {
  id: string;
  quote: string;
  name: string;
  location?: string;
  tour?: string;
  rating?: number;
  date?: string;
  source: 'direct' | 'google' | 'tripadvisor';
  avatarUrl?: string;
  isMock?: boolean;
}

export type MenuLinkType = 'route' | 'anchor' | 'activity' | 'package' | 'external';

export interface MenuItem {
  id: number;
  parent_id: number | null;
  label: string;
  link_type: MenuLinkType;
  target_value: string;
  display_order: number;
  published: boolean | number;
  publish_at?: string | null;
  unpublish_at?: string | null;
  is_currently_visible?: boolean;
  children?: MenuItem[];
  created_at?: string;
  updated_at?: string;
}

export interface Package {
  id: string;
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
  is_currently_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}



