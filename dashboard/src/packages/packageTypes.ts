export type NonEsLocale = 'ca' | 'en' | 'fr';

export interface PackageTranslationData {
  title: string;
  description: string;
  price_unit: string;
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
  published: true,
  publish_at: '',
  unpublish_at: '',
  translations: {
    ca: { title: '', description: '', price_unit: '' },
    en: { title: '', description: '', price_unit: '' },
    fr: { title: '', description: '', price_unit: '' },
  },
};
