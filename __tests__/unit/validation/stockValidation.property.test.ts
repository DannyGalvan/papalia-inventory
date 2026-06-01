/**
 * Property-based tests for the stock validation utilities.
 *
 * Feature: dashboard-reports-inventory-validation
 *   Properties 8–11: correctness of stock validation acceptance/rejection,
 *   error message content, inline warning format, and first-failing-product
 *   reporting on multi-product validation.
 *
 * All tested functions are pure and imported directly from stockValidator —
 * no mocking or DB interaction required.
 *
 * Validates: Requirements 6.1, 6.2, 6.7, 7.1, 7.2, 7.4
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 */

import fc from 'fast-check';
import {
  checkStockForProduct,
  formatStockError,
  OutputDetail,
  validateStockForOutput,
} from '../../../src/utils/stockValidator';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const productNameArbitrary = fc.string({minLength: 1, maxLength: 30});
const productCodeArbitrary = fc.string({minLength: 1, maxLength: 10});
const stockArbitrary = fc.nat({max: 10_000});

/**
 * Generates a (quantity, stock) pair where quantity > stock (failing case).
 * Uses nat() for stock and adds an offset so quantity always exceeds it.
 */
const exceedingPairArbitrary = fc
  .tuple(stockArbitrary, fc.integer({min: 1, max: 1_000}))
  .map(([stock, excess]) => ({stock, quantity: stock + excess}));

/**
 * Generates a (quantity, stock) pair where quantity <= stock (passing case).
 */
const validPairArbitrary = fc
  .tuple(stockArbitrary, stockArbitrary)
  .map(([a, b]) => ({stock: Math.max(a, b), quantity: Math.min(a, b)}));

// ---------------------------------------------------------------------------
// Property 8: Stock validation correctly accepts or rejects based on stock
// Validates: Requirements 6.1, 7.1, 7.4
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports-inventory-validation, Property 8: Stock validation correctly accepts or rejects based on available stock', () => {
  it('rejects when quantity exceeds stock', () => {
    fc.assert(
      fc.property(exceedingPairArbitrary, productCodeArbitrary, productNameArbitrary, ({quantity, stock}, code, name) => {
        const details: OutputDetail[] = [{productCode: code, name, quantity}];
        const stockMap = new Map([[code, stock]]);
        const result = validateStockForOutput(details, stockMap);
        expect(result.isValid).toBe(false);
      }),
      {numRuns: 100},
    );
  });

  it('accepts when quantity does not exceed stock', () => {
    fc.assert(
      fc.property(validPairArbitrary, productCodeArbitrary, productNameArbitrary, ({quantity, stock}, code, name) => {
        const details: OutputDetail[] = [{productCode: code, name, quantity}];
        const stockMap = new Map([[code, stock]]);
        const result = validateStockForOutput(details, stockMap);
        expect(result.isValid).toBe(true);
      }),
      {numRuns: 100},
    );
  });

  it('rejects if and only if quantity > stock', () => {
    fc.assert(
      fc.property(stockArbitrary, stockArbitrary, productCodeArbitrary, productNameArbitrary, (stock, quantity, code, name) => {
        const details: OutputDetail[] = [{productCode: code, name, quantity}];
        const stockMap = new Map([[code, stock]]);
        const result = validateStockForOutput(details, stockMap);
        expect(result.isValid).toBe(quantity <= stock);
      }),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Stock validation error message contains all required information
// Validates: Requirement 6.2
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports-inventory-validation, Property 9: Stock validation error message contains all required information', () => {
  it('error message contains the requested quantity, available stock, and product name', () => {
    fc.assert(
      fc.property(
        productNameArbitrary,
        exceedingPairArbitrary,
        (productName, {quantity, stock}) => {
          const message = formatStockError(quantity, stock, productName);
          expect(message).toContain(String(quantity));
          expect(message).toContain(String(stock));
          expect(message).toContain(productName);
        },
      ),
      {numRuns: 100},
    );
  });

  it('validateStockForOutput error message contains quantity, stock, and product name on failure', () => {
    fc.assert(
      fc.property(
        productCodeArbitrary,
        productNameArbitrary,
        exceedingPairArbitrary,
        (code, name, {quantity, stock}) => {
          const details: OutputDetail[] = [{productCode: code, name, quantity}];
          const stockMap = new Map([[code, stock]]);
          const result = validateStockForOutput(details, stockMap);

          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toContain(String(quantity));
          expect(result.errorMessage).toContain(String(stock));
          expect(result.errorMessage).toContain(name);
        },
      ),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Inline stock warning message format
// Validates: Requirement 7.2
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports-inventory-validation, Property 10: Inline stock warning message format', () => {
  it('warning message equals "Stock disponible: [stock]" when quantity exceeds stock', () => {
    fc.assert(
      fc.property(exceedingPairArbitrary, productNameArbitrary, ({quantity, stock}, name) => {
        const warning = checkStockForProduct(quantity, stock, name);
        expect(warning.hasWarning).toBe(true);
        expect(warning.warningMessage).toBe(`Stock disponible: ${stock}`);
      }),
      {numRuns: 100},
    );
  });

  it('no warning when quantity does not exceed stock', () => {
    fc.assert(
      fc.property(validPairArbitrary, productNameArbitrary, ({quantity, stock}, name) => {
        const warning = checkStockForProduct(quantity, stock, name);
        expect(warning.hasWarning).toBe(false);
        expect(warning.warningMessage).toBe('');
      }),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: First-failing product is reported on multi-product validation
// Validates: Requirement 6.7
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports-inventory-validation, Property 11: First-failing product is reported on multi-product validation', () => {
  /**
   * Generates a list of at least 2 failing products so "first" is meaningful.
   * Each detail has quantity > stock. The first item in the array is the one
   * validateStockForOutput should report.
   */
  const multiFailArbitrary = fc
    .array(
      fc.record({
        code: productCodeArbitrary,
        name: productNameArbitrary,
        excess: fc.integer({min: 1, max: 100}),
        stock: stockArbitrary,
      }),
      {minLength: 2, maxLength: 8},
    )
    .filter(items => {
      const codes = items.map(i => i.code);
      return new Set(codes).size === codes.length; // all codes must be unique
    });

  it('error references the first failing product name, quantity, and stock', () => {
    fc.assert(
      fc.property(multiFailArbitrary, items => {
        const details: OutputDetail[] = items.map(i => ({
          productCode: i.code,
          name: i.name,
          quantity: i.stock + i.excess,
        }));
        const stockMap = new Map(items.map(i => [i.code, i.stock]));

        const result = validateStockForOutput(details, stockMap);

        expect(result.isValid).toBe(false);
        expect(result.failedProductCode).toBe(items[0].code);

        const firstQuantity = items[0].stock + items[0].excess;
        const firstStock = items[0].stock;

        expect(result.errorMessage).toContain(String(firstQuantity));
        expect(result.errorMessage).toContain(String(firstStock));
        expect(result.errorMessage).toContain(items[0].name);
      }),
      {numRuns: 100},
    );
  });

  it('reports first failure even when later products also fail', () => {
    fc.assert(
      fc.property(multiFailArbitrary, items => {
        const details: OutputDetail[] = items.map(i => ({
          productCode: i.code,
          name: i.name,
          quantity: i.stock + i.excess,
        }));
        const stockMap = new Map(items.map(i => [i.code, i.stock]));

        const result = validateStockForOutput(details, stockMap);

        // failedProductCode must be the first item's code, not any other
        expect(result.failedProductCode).toBe(details[0].productCode);
      }),
      {numRuns: 100},
    );
  });
});
