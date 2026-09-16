const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

/**
 * Resolves a media or image URL to a full accessible URL.
 * Handles full URLs (http/https), absolute paths (/api/uploads/...), and filenames.
 */
export function resolveMediaUrl(urlOrFilename: string | null | undefined, fallback: string = ''): string {
  if (!urlOrFilename) return fallback;

  const trimmed = urlOrFilename.trim();
  if (!trimmed) return fallback;

  // Already a full external or absolute protocol URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return trimmed;
  }

  // If it's already an absolute path starting with /api/
  if (trimmed.startsWith('/api/')) {
    // If API_BASE is custom (e.g. http://localhost:8000), adjust
    if (API_BASE && !API_BASE.startsWith('/')) {
      return `${API_BASE}${trimmed.substring(4)}`;
    }
    return trimmed;
  }

  // If it starts with / (e.g. /uploads/...)
  if (trimmed.startsWith('/')) {
    return `${API_BASE}${trimmed}`;
  }

  // Just a filename (e.g. "image.jpg")
  return `${API_BASE}/uploads/${trimmed}`;
}

