export type ActivityType =
  | 'BTT'
  | '4x4'
  | 'Vía Ferrata'
  | 'Senderismo'
  | 'Esquí-Snow'
  | 'Rafting'
  | 'Heliflight';

export const ACTIVITY_TYPES: ActivityType[] = [
  'BTT',
  '4x4',
  'Vía Ferrata',
  'Senderismo',
  'Esquí-Snow',
  'Rafting',
  'Heliflight',
];

export interface ActivityTranslations {
  ca?: {
    title?: string;
    description?: string;
    highlights?: string[];
  };
  en?: {
    title?: string;
    description?: string;
    highlights?: string[];
  };
  fr?: {
    title?: string;
    description?: string;
    highlights?: string[];
  };
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
  highlights: string[];
  display_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
  translations?: ActivityTranslations;
}
