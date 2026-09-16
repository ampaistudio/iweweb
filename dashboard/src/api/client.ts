import type {
  ApiResponse,
  AuthUser,
  MediaItem,
  SiteContentResponse,
  Post,
  OverviewData,
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
    list: () => request<SiteContentResponse>('/content', { method: 'GET' }),
    update: (key: string, value: string) =>
      request<{ content_key: string; content_value: string }>(`/content/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ content_value: value }),
      }),
  },

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
    list: () => request<Post[]>('/posts', { method: 'GET' }),
    get: (idOrSlug: string | number) => request<Post>(`/posts/${idOrSlug}`, { method: 'GET' }),
    create: (postData: {
      title: string;
      body: string;
      cover_media_id?: number | null;
      status: 'draft' | 'published';
      publish_to_facebook?: boolean;
      publish_to_instagram?: boolean;
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
    list: (params?: { type?: string; published?: number }) => {
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.published !== undefined) query.append('published', String(params.published));
      const qs = query.toString();
      return request<unknown[]>(`/activities${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    get: (id: string) => request<unknown>(`/activities/${encodeURIComponent(id)}`, { method: 'GET' }),
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
  },
};
