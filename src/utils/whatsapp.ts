/**
 * Builds a wa.me link from a display phone number.
 * and an optional prefilled message. Strips everything except digits, since
 * wa.me requires the full international number with no separators or "+".
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digitsOnly}${query}`;
}

export function buildReservationWhatsAppUrl(phone: string, experienceTitle: string): string {
  return buildWhatsAppUrl(phone, `Hola! Quiero reservar una experiencia con iWE: ${experienceTitle}`);
}
