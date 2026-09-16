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
}
