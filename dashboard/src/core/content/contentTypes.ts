export type NonEsLocale = 'ca' | 'en' | 'fr';

export type PickerTarget = 'logo' | 'og_image' | 'mission_image' | 'team_image' | null;

export interface DirectReviewItem {
  name: string;
  quote: string;
  rating: number;
  location?: string;
  tour?: string;
}

export const DEFAULT_DIRECT_REVIEWS_JSON = JSON.stringify([
  {
    quote: 'Charlie fue un guía excepcional en nuestra ruta 4x4 hasta Tor: gran conocedor de la zona, muy buen conductor y siempre atento a que disfrutáramos cada parada para sacar fotos.',
    name: 'Joan',
    location: 'Andorra la Vella',
    tour: '4x4 a Tor',
    rating: 5,
  },
  {
    quote: 'Salimos en e-bike por las montañas de Andorra con Carlos como guía. Se adaptó a nuestro nivel técnico y físico desde el primer momento y nos llevó por rutas que jamás hubiéramos encontrado solos.',
    name: 'Cliente verificado',
    location: 'Begur, España',
    tour: 'E-Bike Enduro',
    rating: 5,
  },
  {
    quote: 'Reservamos una excursión 4x4 con nuestro perro y aprendimos sobre la naturaleza y la historia de la zona durante todo el recorrido. Una experiencia que recomendamos sin dudar.',
    name: 'Melanie',
    location: 'Países Bajos',
    tour: '4x4 Lagos Off-Road',
    rating: 5,
  },
]);

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

