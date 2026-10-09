/**
 * Flexible price helpers.
 *
 * Prices can be a plain number (500), a numeric string ("500"),
 * or free text such as a range ("300-700"), "up to 300", "negotiable", etc.
 * These helpers keep every display site consistent and let order totals
 * fall back to a best-effort numeric value when the price is not a plain number.
 */

export type FlexiblePrice = number | string | null | undefined;

/** Extract the first usable number from a flexible price. Returns 0 when none found. */
export function parsePriceToNumber(value: FlexiblePrice): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value).trim();
  if (!text) return 0;
  // Plain numeric string (allows commas / decimals)
  const plain = Number(text.replace(/,/g, ''));
  if (Number.isFinite(plain) && text.match(/^[\d,.\s]+$/)) return plain;
  // Otherwise grab the first number sequence (handles "300-700", "up to 300", "Br 500")
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!match) return 0;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : 0;
}

/** True when the value is a plain single number (number type or numeric string). */
export function isPlainNumericPrice(value: FlexiblePrice): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  const text = value.trim().replace(/,/g, '');
  return text !== '' && /^ -?\d+(\.\d+)?$/.test(text.replace(/\s+/g, '')) && Number.isFinite(Number(text));
}

/** Raw price text without currency prefix — e.g. `500` -> "500", `"300-700"` -> "300-700". */
export function priceText(value: FlexiblePrice): string {
  if (value == null) return '0';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : '0';
  const text = String(value).trim();
  if (!text) return '0';
  // Format plain numeric strings with thousand separators for consistency
  if (isPlainNumericPrice(text)) return Number(text.replace(/,/g, '')).toLocaleString();
  return text;
}

/** Display price with Br prefix — e.g. "Br 500" or "Br 300-700". */
export function formatPrice(value: FlexiblePrice): string {
  return `Br ${priceText(value)}`;
}

/**
 * Normalize an incoming API/form price for storage.
 * Keeps numbers as numbers; trims strings (max 50 chars).
 * Returns undefined when empty so callers can apply defaults.
 */
export function normalizePriceInput(value: unknown): number | string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return 0;
    return value;
  }
  if (typeof value === 'string') {
    const text = value.trim().slice(0, 50);
    if (!text) return undefined;
    // Store plain numeric strings as numbers for backwards compatibility
    if (/^[\d,.\s]+$/.test(text)) {
      const n = Number(text.replace(/,/g, ''));
      if (Number.isFinite(n) && n >= 0) return n;
    }
    return text;
  }
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
