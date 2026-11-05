import fc from 'fast-check';
import {
  DEFAULT_PRODUCT_CODE_FORMAT,
  formatProductCode,
  highestProductCodeSequence,
  parseProductCodeSequence,
} from '../../../../src/services/product/productCodeFormat';

describe('formatProductCode', () => {
  it('zero-pads to the configured digits', () => {
    expect(formatProductCode(1)).toBe('PRD-000001');
    expect(formatProductCode(42)).toBe('PRD-000042');
  });

  it('keeps growing past the padding instead of truncating', () => {
    expect(formatProductCode(1_234_567)).toBe('PRD-1234567');
  });

  it('honours a custom format', () => {
    expect(formatProductCode(3, { prefix: 'X', digits: 2 })).toBe('X03');
  });

  it.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid sequence %p',
    value => {
      expect(() => formatProductCode(value)).toThrow(RangeError);
    },
  );
});

describe('parseProductCodeSequence', () => {
  it('reads generated codes', () => {
    expect(parseProductCodeSequence('PRD-000123')).toBe(123);
    expect(parseProductCodeSequence('PRD-9999999')).toBe(9_999_999);
  });

  it.each([
    'P-0001',
    'PRD-',
    'PRD-12a',
    'prd-000001',
    ' PRD-000001',
    'PRD-000000',
    'XPRD-000001',
  ])('ignores foreign code %p', code => {
    expect(parseProductCodeSequence(code)).toBeNull();
  });

  it('escapes regex characters in the prefix', () => {
    const format = { prefix: 'A.B+', digits: 3 };
    expect(parseProductCodeSequence('A.B+007', format)).toBe(7);
    expect(parseProductCodeSequence('AxBB007', format)).toBeNull();
  });

  it('round-trips every valid sequence (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e12 }), n => {
        expect(parseProductCodeSequence(formatProductCode(n))).toBe(n);
      }),
      { numRuns: 200 },
    );
  });
});

describe('highestProductCodeSequence', () => {
  it('is 0 without generated codes', () => {
    expect(highestProductCodeSequence([])).toBe(0);
    expect(highestProductCodeSequence(['P-0001', 'abc'])).toBe(0);
  });

  it('picks the numeric (not lexical) maximum', () => {
    expect(
      highestProductCodeSequence(['PRD-000009', 'PRD-1000000', 'PRD-000010']),
    ).toBe(1_000_000);
  });

  it('uses the default format', () => {
    expect(DEFAULT_PRODUCT_CODE_FORMAT).toEqual({ prefix: 'PRD-', digits: 6 });
  });
});
