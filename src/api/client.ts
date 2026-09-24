import type {
  ApiResponse,
  ApiHeroSlide,
  RawApiActivity,
  SiteContentResponse,
  Post,
  GoogleReviewsResponse,
  TripAdvisorReviewsResponse,
  MenuItem,
  Package,
  ActivityTypeItem,
} from './types';


const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 5000;

export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number = 400, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const config: RequestInit = {
    ...options,
    headers,
    signal: options.signal || controller.signal,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Tiempo de espera agotado al conectar con el servidor.', 408);
    }
    throw new ApiError('No se pudo conectar con el servidor.', 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  let data: ApiResponse<T> | null = null;

  if (isJson) {
    try {
      data = await response.json();
    } catch {
      // JSON parse error
    }
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Error ${response.status}: Respuesta no satisfactoria del servidor.`;
    throw new ApiError(errorMsg, response.status, data?.details);
  }

  if (data && data.success === false) {
    throw new ApiError(data.error || 'Error en la operación', response.status, data.details);
  }

  return (data?.data !== undefined ? data.data : data) as T;
}

export const publicApi = {
  activities: {
    list: (params?: { type?: string; locale?: string }) => {
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.locale) query.append('locale', params.locale);
      const qs = query.toString();
      return request<RawApiActivity[]>(`/activities${qs ? `?${qs}` : ''}`);
    },
    get: (id: string, locale?: string) =>
      request<RawApiActivity>(`/activities/${encodeURIComponent(id)}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  },

  content: {
    get: (locale?: string) =>
      request<SiteContentResponse>(`/content${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  },

  heroSlides: {
    list: () => request<ApiHeroSlide[]>('/hero-slides'),
  },

  posts: {
    list: (params?: { locale?: string }) => {
      const query = new URLSearchParams();
      if (params?.locale) query.append('locale', params.locale);
      const qs = query.toString();
      return request<Post[]>(`/posts${qs ? `?${qs}` : ''}`);
    },
    get: (idOrSlug: string | number, locale?: string) =>
      request<Post>(`/posts/${encodeURIComponent(String(idOrSlug))}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  },

  reviews: {
    google: () => request<GoogleReviewsResponse>('/reviews/google'),
    tripadvisor: () => request<TripAdvisorReviewsResponse>('/reviews/tripadvisor'),
  },

  menu: {
    list: (params?: { locale?: string }) => {
      const query = new URLSearchParams();
      if (params?.locale) query.append('locale', params.locale);
      const qs = query.toString();
      return request<MenuItem[]>(`/menu${qs ? `?${qs}` : ''}`);
    },
  },

  packages: {
    list: (params?: { locale?: string }) => {
      const query = new URLSearchParams();
      if (params?.locale) query.append('locale', params.locale);
      const qs = query.toString();
      return request<Package[]>(`/packages${qs ? `?${qs}` : ''}`);
    },
    get: (id: string, locale?: string) =>
      request<Package>(`/packages/${encodeURIComponent(id)}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  },

  activityTypes: {
    list: () => request<ActivityTypeItem[]>('/activity-types'),
  },

  newsletter: {
    subscribe: (email: string) =>
      request<{ email: string; status: string }>('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },
};

