/** Shape of auto-generated product codes: `<prefix><zero-padded number>`. */
export interface ProductCodeFormat {
  prefix: string;
  /** Minimum digits; longer sequences keep growing (never truncated). */
  digits: number;
}

export const DEFAULT_PRODUCT_CODE_FORMAT: ProductCodeFormat = {
  prefix: 'PRD-',
  digits: 6,
};

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `formatProductCode(7)` → `PRD-000007`. */
export const formatProductCode = (
  sequence: number,
  format: ProductCodeFormat = DEFAULT_PRODUCT_CODE_FORMAT,
): string => {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new RangeError(`Secuencia de código inválida: ${sequence}`);
  }
  return `${format.prefix}${String(sequence).padStart(format.digits, '0')}`;
};

/**
 * Sequence number of a code that follows `format`, or `null` for any other
 * code (manual or imported codes such as `P-0001`).
 */
export const parseProductCodeSequence = (
  code: string,
  format: ProductCodeFormat = DEFAULT_PRODUCT_CODE_FORMAT,
): number | null => {
  const match = new RegExp(`^${escapeRegExp(format.prefix)}(\\d+)$`).exec(code);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

/** Highest sequence among `codes` that follow `format` (0 when none). */
export const highestProductCodeSequence = (
  codes: readonly string[],
  format: ProductCodeFormat = DEFAULT_PRODUCT_CODE_FORMAT,
): number =>
  codes.reduce((max, code) => {
    const value = parseProductCodeSequence(code, format);
    return value !== null && value > max ? value : max;
  }, 0);
