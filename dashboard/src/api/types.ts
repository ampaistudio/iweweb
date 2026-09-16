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
  created_at: string;
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
