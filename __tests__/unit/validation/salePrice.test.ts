/**
 * Sale price override helpers and their effect on log form validation.
 */

import fc from 'fast-check';
import type { LogHeader } from '../../../src/database/models/LogHeader';
import {
  isBelowCost,
  isValidPrice,
  parsePriceInput,
  priceAdjustmentPct,
} from '../../../src/utils/salePrice';
import {
  LOG_FORM_MESSAGES,
  validateLogForm,
} from '../../../src/utils/validateLogForm';

jest.mock('typeorm', () => {
  const decorator =
    (..._a: unknown[]) =>
    (..._b: unknown[]): void => {};
  return {
    Entity: decorator,
    Column: decorator,
    PrimaryGeneratedColumn: decorator,
    PrimaryColumn: decorator,
    OneToMany: decorator,
    ManyToOne: decorator,
    JoinColumn: decorator,
  };
});

describe('parsePriceInput', () => {
  it.each([
    ['45', 45],
    ['45.5', 45.5],
    ['45,5', 45.5],
    [' 0 ', 0],
    ['.5', 0.5],
  ])('parses %p', (text, expected) => {
    expect(parsePriceInput(text)).toBe(expected);
  });

  it.each(['', '  ', 'abc', '-1', '1.2.3', 'Q10', '1e3'])(
    'rejects %p',
    text => {
      expect(parsePriceInput(text)).toBeNull();
    },
  );

  it('round-trips any non-negative amount with two decimals', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), cents => {
        const value = cents / 100;
        expect(parsePriceInput(value.toFixed(2))).toBeCloseTo(value, 2);
      }),
      { numRuns: 100 },
    );
  });
});

describe('priceAdjustmentPct', () => {
  it('reports discounts and surcharges', () => {
    expect(priceAdjustmentPct(100, 90)).toBeCloseTo(-10, 6);
    expect(priceAdjustmentPct(100, 105)).toBeCloseTo(5, 6);
  });

  it('is null when unchanged or the list price is 0', () => {
    expect(priceAdjustmentPct(45.5, 45.5)).toBeNull();
    expect(priceAdjustmentPct(0.1 + 0.2, 0.3)).toBeNull();
    expect(priceAdjustmentPct(0, 10)).toBeNull();
  });
});

describe('isBelowCost', () => {
  it('flags sale prices under a known cost', () => {
    expect(isBelowCost(25, 30)).toBe(true);
    expect(isBelowCost(30, 30)).toBe(false);
    expect(isBelowCost(5, 0)).toBe(false);
  });
});

describe('validateLogForm — detail prices', () => {
  const form = (price: unknown) =>
    ({
      id: 1,
      type: 1,
      comments: 'Venta',
      createdAt: new Date('2026-11-01T00:00:00Z'),
      isInput: false,
      logDetails: [{ id: 1, name: 'Café', quantity: 2, price }],
    } as unknown as LogHeader);

  it('accepts a modified valid price, including 0', () => {
    expect(validateLogForm(form(39.99)).details).toBeUndefined();
    expect(validateLogForm(form(0)).details).toBeUndefined();
  });

  it('blocks submit when a price is invalid', () => {
    expect(validateLogForm(form(Number.NaN)).details).toBe(
      LOG_FORM_MESSAGES.price,
    );
    expect(validateLogForm(form(-1)).details).toBe(LOG_FORM_MESSAGES.price);
    expect(isValidPrice('10')).toBe(false);
  });
});
