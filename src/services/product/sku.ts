/** Rules for the optional supplier code (SKU) of a product. */

export const SKU_MAX_LENGTH = 50;

// Control characters (tabs, new lines, …) break search and Excel exports.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

/** Trimmed SKU; any missing / non-text value becomes '' (no SKU). */
export const normalizeSku = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return typeof value === 'string' ? value.trim() : '';
};

/** Error message for an invalid SKU, or `null` when valid (empty is valid). */
export const validateSku = (value: unknown): string | null => {
  const sku = normalizeSku(value);
  if (sku.length > SKU_MAX_LENGTH) {
    return `El SKU no puede tener más de ${SKU_MAX_LENGTH} caracteres`;
  }
  if (CONTROL_CHARS.test(sku)) {
    return 'El SKU contiene caracteres no permitidos';
  }
  return null;
};

export const duplicateSkuMessage = (sku: string, ownerCode: string) =>
  `El SKU "${sku}" ya está asignado al producto ${ownerCode}`;
