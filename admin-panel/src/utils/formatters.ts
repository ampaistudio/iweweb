/**
 * Utility to format monetary amounts consistently across the admin panel with Euro (€) currency.
 * Accepts numbers (e.g. 120.50), string numbers ("85", "85.50"), or pre-formatted strings ("85 €").
 */
export function formatPrice(
  amount: number | string | null | undefined,
  unit?: string | null
): string {
  if (amount === null || amount === undefined) {
    return 'Consultar';
  }

  let num: number | null = null;
  let parsedUnit = unit ? unit.trim() : '';

  if (typeof amount === 'number') {
    if (isNaN(amount)) return 'Consultar';
    num = amount;
  } else if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (!trimmed || trimmed.toLowerCase() === 'consultar') {
      return 'Consultar';
    }

    // Extract numeric portion if present
    const cleanStr = trimmed.replace('€', '').replace('EUR', '').trim();
    const matches = cleanStr.match(/^([\d.,]+)\s*(.*)$/);

    if (matches) {
      const numPart = matches[1].replace(',', '.');
      const parsedNum = parseFloat(numPart);
      if (!isNaN(parsedNum)) {
        num = parsedNum;
        if (!parsedUnit && matches[2]) {
          parsedUnit = matches[2].replace(/^\/\s*/, '').trim();
        }
      }
    }

    if (num === null) {
      const hasEuro = trimmed.includes('€') || trimmed.includes('EUR');
      const baseStr = hasEuro ? trimmed.replace('EUR', '€').trim() : `${trimmed} €`;
      return parsedUnit ? `${baseStr} / ${parsedUnit}` : baseStr;
    }
  }

  if (num === null) {
    return 'Consultar';
  }

  const formattedNum = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  const priceStr = `${formattedNum} €`;

  if (parsedUnit) {
    return `${priceStr} / ${parsedUnit}`;
  }

  return priceStr;
}
