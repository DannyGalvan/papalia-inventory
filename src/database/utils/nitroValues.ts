/**
 * Normalizers for raw values coming from react-native-nitro-sqlite.
 *
 * The driver returns `{ isNitroSQLiteNull: true }` for NULL columns — and on
 * Android also for falsy integers/booleans (0) — and may surface booleans as
 * 0/1 or 'true'/'false'. These helpers coerce such values into safe JS types.
 */

export const isNitroNull = (value: unknown): boolean =>
  value !== null &&
  typeof value === 'object' &&
  Object.prototype.hasOwnProperty.call(value, 'isNitroSQLiteNull');

/** Truthy only for real "true" representations; null markers are false. */
export const toBool = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === 'true';

/** Finite number or `fallback` (null markers, NaN, non-numeric → fallback). */
export const toNumber = (value: unknown, fallback = 0): number => {
  // Only primitives are coerced: objects (incl. null markers) could throw or
  // produce surprising values through custom valueOf/toString.
  if (typeof value !== 'number' && typeof value !== 'string') {
    return fallback;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** String value or `fallback` for null markers / non-strings. */
export const toText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
