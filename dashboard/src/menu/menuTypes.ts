import type { MenuLinkType } from '../api/types';

export const LINK_TYPE_OPTIONS: Array<{ value: MenuLinkType; label: string }> = [
  { value: 'route', label: 'Ruta Interna (ej: /privacidad)' },
  { value: 'activity', label: 'Actividad de Turismo (Slug: ebike-arcalis)' },
  { value: 'package', label: 'Paquete Multidía (Slug: andorra-holiday-8d)' },
  { value: 'anchor', label: 'Ancla en Página (ej: /#viajes-medida)' },
  { value: 'external', label: 'Enlace Externo (ej: https://...)' },
];

export type NonEsLocale = 'ca' | 'en' | 'fr';

export interface MenuFormState {
  id?: number;
  parent_id: number | null;
  label: string;
  link_type: MenuLinkType;
  target_value: string;
  published: boolean;
  publish_at: string;
  unpublish_at: string;
  translations: {
    ca: { label: string };
    en: { label: string };
    fr: { label: string };
  };
}

export const INITIAL_MENU_FORM_STATE: MenuFormState = {
  parent_id: null,
  label: '',
  link_type: 'route',
  target_value: '/',
  published: true,
  publish_at: '',
  unpublish_at: '',
  translations: {
    ca: { label: '' },
    en: { label: '' },
    fr: { label: '' },
  },
};

