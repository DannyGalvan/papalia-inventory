/**
 * Profit helpers shared by the product form, product cards and reports.
 */

/** Gross margin as a percentage of the sale price; null when price is 0. */
export const calculateMarginPct = (
  price: number,
  cost: number,
): number | null => {
  const p = Number(price) || 0;
  const c = Number(cost) || 0;
  if (p <= 0) {
    return null;
  }
  return ((p - c) / p) * 100;
};

/** Format a percentage with one decimal, e.g. `35.4 %`. */
export const formatPct = (value: number | null): string =>
  value === null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)} %`;

/** Margin below this percentage is flagged as low in the UI and reports. */
export const LOW_MARGIN_THRESHOLD_PCT = 15;
