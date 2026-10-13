/**
 * Text and formatting utilities with XSS security.
 */

/**
 * Escapes HTML characters in a string to prevent XSS injection.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Splits plain text into paragraphs safely, trimming whitespace.
 */
export function formatTextParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Extract readable text for excerpts, metadata and structured data. */
export function richTextToPlainText(text: string): string {
  const spaced = text.replace(/<\/(?:p|h[1-6]|li)>|<br\s*\/?>/gi, ' ');
  const plain = typeof DOMParser === 'undefined' ? spaced.replace(/<[^>]*>/g, '')
    : new DOMParser().parseFromString(spaced, 'text/html').body.textContent || '';
  return plain.replace(/\s+/g, ' ').trim();
}

/**
 * Generates a clean text excerpt from a post body.
 */
export function generateExcerpt(text: string, maxLength: number = 160): string {
  if (!text) return '';
  // Strip any raw tags if present
  const clean = richTextToPlainText(text);
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '...';
}

/**
 * Formats an ISO / MySQL timestamp string into a friendly localized date.
 */
export function formatDate(dateString: string | null | undefined, locale: string = 'es-ES'): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

