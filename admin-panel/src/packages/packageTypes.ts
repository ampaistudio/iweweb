import type { PackageMedia } from '../api/types';

export type NonEsLocale = 'ca' | 'en' | 'fr';

export interface PackageTranslationData {
  title: string;
  description: string;
  price_unit: string;
  intro_title: string;
  intro_text: string;
  highlights: string[];
  itinerary: string[];
}

export interface PackageFormState {
  id: string;
  title: string;
  duration: string;
  description: string;
  image_url: string;
  alt_text: string;
  price_amount: string;
  price_currency: string;
  price_unit: string;
  menu_parent_id: number | null;
  intro_title: string;
  intro_text: string;
  highlights: string[];
  itinerary: string[];
  media: PackageMedia[];
  published: boolean;
  publish_at: string;
  unpublish_at: string;
  translations: {
    ca: PackageTranslationData;
    en: PackageTranslationData;
    fr: PackageTranslationData;
  };
}

export const INITIAL_PACKAGE_FORM_STATE: PackageFormState = {
  id: '',
  title: '',
  duration: '8 días / 7 noches',
  description: '',
  image_url: '',
  alt_text: '',
  price_amount: '',
  price_currency: 'EUR',
  price_unit: 'por persona',
  menu_parent_id: null,
  intro_title: '',
  intro_text: '',
  highlights: [],
  itinerary: [],
  media: [],
  published: true,
  publish_at: '',
  unpublish_at: '',
  translations: {
    ca: { title: '', description: '', price_unit: '', intro_title: '', intro_text: '', highlights: [], itinerary: [] },
    en: { title: '', description: '', price_unit: '', intro_title: '', intro_text: '', highlights: [], itinerary: [] },
    fr: { title: '', description: '', price_unit: '', intro_title: '', intro_text: '', highlights: [], itinerary: [] },
  },
};
