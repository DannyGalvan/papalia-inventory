/**
 * Helpers for overriding the unit price of a sale detail.
 */

/**
 * Parse a price typed by the user. Accepts `,` or `.` as decimal separator.
 * Returns null for empty, non-numeric or negative input.
 */
export const parsePriceInput = (text: string): number | null => {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '' || !/^\d*\.?\d*$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

/**
 * Percentage difference between the sale price and the product's list price
 * (e.g. -10 for a 10 % discount). Null when the list price is 0 or prices
 * are equal (to the cent).
 */
export const priceAdjustmentPct = (
  listPrice: number,
  salePrice: number,
): number | null => {
  const list = Number(listPrice) || 0;
  const sale = Number(salePrice) || 0;
  if (list <= 0 || Math.round(list * 100) === Math.round(sale * 100)) {
    return null;
  }
  return ((sale - list) / list) * 100;
};

/** True when a positive cost is known and the sale price is below it. */
export const isBelowCost = (salePrice: number, unitCost: number): boolean => {
  const cost = Number(unitCost) || 0;
  return cost > 0 && (Number(salePrice) || 0) < cost;
};

/** A detail price is valid when it is a finite number >= 0. */
export const isValidPrice = (price: unknown): boolean =>
  typeof price === 'number' && Number.isFinite(price) && price >= 0;
