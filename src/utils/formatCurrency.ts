/**
 * Formats a numeric value as currency.
 * @param value - The numeric value to format
 * @param symbol - Currency prefix symbol (default: 'Q')
 * @returns Formatted string, e.g. "Q1234.56"
 */
export const formatCurrency = (value: number, symbol = 'Q'): string =>
  `${symbol}${value.toFixed(2)}`;
