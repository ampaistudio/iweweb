export type NonEsLocale = 'ca' | 'en' | 'fr';

export type PickerTarget = 'logo' | 'og_image' | 'mission_image' | 'team_image' | null;

export interface DirectReviewItem {
  name: string;
  quote: string;
  rating: number;
  location?: string;
  tour?: string;
}

export const DEFAULT_DIRECT_REVIEWS_JSON = '[]';

export const parseDirectReviews = (raw?: string): DirectReviewItem[] => {
  try {
    const text = raw || DEFAULT_DIRECT_REVIEWS_JSON;
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const DEFAULT_KEYS: Record<string, string> = {
  site_url: 'https://i-wildland.com',
  weather_map_lat: '42.5459743',
  weather_map_lon: '1.5140217',
};

