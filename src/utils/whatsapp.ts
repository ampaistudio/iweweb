/**
 * Builds a wa.me link from a display phone number (e.g. "+376 653 769")
 * and an optional prefilled message. Strips everything except digits, since
 * wa.me requires the full international number with no separators or "+".
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digitsOnly}${query}`;
}
