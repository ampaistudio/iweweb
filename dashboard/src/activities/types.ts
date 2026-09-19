export type ActivityType = string;

export const DEFAULT_ACTIVITY_TYPES: string[] = [
  'BTT',
  '4x4',
  'Vía Ferrata',
  'Senderismo',
  'Esquí-Snow',
  'Rafting',
  'Heliflight',
];

export const ACTIVITY_TYPES = DEFAULT_ACTIVITY_TYPES;

export interface ActivityTranslations {
  ca?: {
    title?: string;
    description?: string;
    intro_title?: string;
    intro_text?: string;
    highlights?: string[];
  };
  en?: {
    title?: string;
    description?: string;
    intro_title?: string;
    intro_text?: string;
    highlights?: string[];
  };
  fr?: {
    title?: string;
    description?: string;
    intro_title?: string;
    intro_text?: string;
    highlights?: string[];
  };
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
}
