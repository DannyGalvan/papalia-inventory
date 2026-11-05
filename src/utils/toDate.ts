/**
 * Coerce a raw value (Date, ISO string, epoch ms) into a valid Date.
 * Returns null for invalid dates, nitro-sqlite null markers and other objects.
 */
export const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};
