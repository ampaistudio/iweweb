import type {
  ApiResponse,
  AuthUser,
  MediaItem,
  HeroSlideItem,
  SiteContentResponse,
  Post,
  OverviewData,
  MenuItem,
  MenuItemPayload,
  PackageItem,
  PackagePayload,
  ActivityImage,
} from './types';


const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

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
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // include PHP session cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión de red.', 0);
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
    const errorMsg = data?.error || (response.status === 401 ? 'Sesión expirada o no autorizada.' : 'Ocurrió un error inesperado al procesar la solicitud.');
    throw new ApiError(errorMsg, response.status, data?.details);
  }

  if (data && data.success === false) {
    throw new ApiError(data.error || 'Error en la operación', response.status, data.details);
  }

  return (data?.data !== undefined ? data.data : data) as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request<void>('/auth/logout', {
        method: 'POST',
      }),
    me: () =>
      request<{ user: AuthUser }>('/auth/me', {
        method: 'GET',
      }),
  },

  overview: {
    get: () => request<OverviewData>('/overview', { method: 'GET' }),
  },

  content: {
    list: (locale?: string) => request<SiteContentResponse>(`/content${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`, { method: 'GET' }),
    update: (key: string, value: string, translations?: Record<string, string>) =>
      request<{ content_key: string; content_value: string }>(`/content/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ content_value: value, translations }),
      }),
  },

  heroSlides: {
    listAll: () => request<HeroSlideItem[]>('/hero-slides/all', { method: 'GET' }),
    create: (data: FormData | {
      slide_type?: 'image' | 'video';
      media_source?: 'upload' | 'external_url';
      src: string;
      poster?: string | null;
      alt: string;
      display_order?: number;
      published?: boolean;
    }) => {
      const isFormData = data instanceof FormData;
      return request<HeroSlideItem>('/hero-slides', {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
      });
    },
    update: (id: number, data: {
      slide_type?: 'image' | 'video';
      media_source?: 'upload' | 'external_url';
      src?: string;
      poster?: string | null;
      alt?: string;
      display_order?: number;
      published?: boolean;
    }) =>
      request<HeroSlideItem>(`/hero-slides/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/hero-slides/${id}`, {
        method: 'DELETE',
      }),
    reorder: (ids: number[]) =>
      request<void>('/hero-slides/reorder', {
        method: 'PUT',
        body: JSON.stringify({ ids }),
      }),
  },

  translate: (params: { text: string; target_locale: 'ca' | 'en' | 'fr'; source_locale?: string; field_name?: string }) =>
    request<{ translated_text: string; target_locale: string; source_locale: string; model: string }>('/translate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  media: {
    list: () => request<MediaItem[]>('/media', { method: 'GET' }),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return request<MediaItem>('/media', {
        method: 'POST',
        body: formData,
      });
    },
    delete: (id: number) =>
      request<void>(`/media/${id}`, {
        method: 'DELETE',
      }),
  },

  posts: {
    list: (params?: { locale?: string }) => {
      const query = new URLSearchParams();
      if (params?.locale) query.append('locale', params.locale);
      const qs = query.toString();
      return request<Post[]>(`/posts${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    get: (idOrSlug: string | number, locale?: string) =>
      request<Post>(`/posts/${idOrSlug}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`, { method: 'GET' }),
    create: (postData: {
      title: string;
      body: string;
      cover_media_id?: number | null;
      status: 'draft' | 'published';
      publish_to_facebook?: boolean;
      publish_to_instagram?: boolean;
      translations?: Record<string, { title?: string; body?: string }>;
    }) =>
      request<{ id: number; title: string; slug: string; status: string; social_sync: Record<string, unknown> }>(
        '/posts',
        {
          method: 'POST',
          body: JSON.stringify(postData),
        }
      ),
    update: (
      id: number,
      postData: {
        title?: string;
        body?: string;
        cover_media_id?: number | null;
        status?: 'draft' | 'published';
        publish_to_facebook?: boolean;
        publish_to_instagram?: boolean;
        retry_platform?: 'facebook' | 'instagram';
        translations?: Record<string, { title?: string; body?: string }>;
      }
    ) =>
      request<{ id: number; title: string; slug: string; status: string; social_sync: Record<string, unknown> }>(
        `/posts/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(postData),
        }
      ),
    delete: (id: number) => request<void>(`/posts/${id}`, { method: 'DELETE' }),
  },

  activities: {
    list: (params?: { type?: string; published?: number; locale?: string }) => {
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.published !== undefined) query.append('published', String(params.published));
      if (params?.locale) query.append('locale', params.locale);
      const qs = query.toString();
      return request<unknown[]>(`/activities${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    get: (id: string, locale?: string) =>
      request<unknown>(`/activities/${encodeURIComponent(id)}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`, { method: 'GET' }),
    create: (data: unknown) =>
      request<{ id: string; title: string }>('/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<{ id: string }>(`/activities/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/activities/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    duplicate: (id: string) =>
      request<{ id: string; title: string }>(`/activities/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
      }),
    addImage: (activityId: string, data: { image_url: string; media_type?: 'image' | 'video'; poster_url?: string; alt_text: string; is_cover?: boolean }) =>
      request<ActivityImage>(`/activities/${encodeURIComponent(activityId)}/images`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    removeImage: (activityId: string, imageId: number) =>
      request<void>(`/activities/${encodeURIComponent(activityId)}/images/${imageId}`, {
        method: 'DELETE',
      }),
    setCoverImage: (activityId: string, imageId: number) =>
      request<void>(`/activities/${encodeURIComponent(activityId)}/images/${imageId}/cover`, {
        method: 'PUT',
      }),
    reorderImages: (activityId: string, items: { id: number; display_order: number }[]) =>
      request<void>(`/activities/${encodeURIComponent(activityId)}/images`, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }),
  },

  menu: {
    list: (includeUnpublished: boolean = true) =>
      request<MenuItem[]>(`/menu${includeUnpublished ? '?includeUnpublished=1' : ''}`, { method: 'GET' }),
    get: (id: number) =>
      request<MenuItem>(`/menu/${id}`, { method: 'GET' }),
    create: (data: MenuItemPayload) =>
      request<{ id: number }>('/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: MenuItemPayload) =>
      request<{ id: number }>(`/menu/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/menu/${id}`, {
        method: 'DELETE',
      }),
    reorder: (items: Array<{ id: number; parent_id?: number | null; display_order?: number }>) =>
      request<void>('/menu/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }),
  },

  packages: {
    list: (params?: { includeUnpublished?: boolean; locale?: string }) => {
      const query = new URLSearchParams();
      if (params?.includeUnpublished !== undefined) query.append('includeUnpublished', params.includeUnpublished ? '1' : '0');
      if (params?.locale) query.append('locale', params.locale);
      const qs = query.toString();
      return request<PackageItem[]>(`/packages${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    get: (id: string, locale?: string) =>
      request<PackageItem>(`/packages/${encodeURIComponent(id)}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`, { method: 'GET' }),
    create: (data: PackagePayload) =>
      request<{ id: string }>('/packages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: PackagePayload) =>
      request<{ id: string }>(`/packages/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/packages/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    reorder: (items: Array<{ id: string; display_order?: number }>) =>
      request<void>('/packages/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }),
  },
};

