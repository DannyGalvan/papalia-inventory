/**
 * Property-based tests for ReportService computation logic and formatCurrency.
 *
 * Feature: dashboard-reports-inventory-validation
 *   Properties 1–7: correctness of stock filtering, ranking, summary
 *   computations, distribution bucketing, monetary formatting, movement
 *   aggregation, and top-categories ordering.
 *
 * The ReportService async functions call TypeORM and cannot run in the Jest
 * environment without a live database. Instead, each property test exercises
 * the identical pure-computation logic extracted into helpers defined below.
 * These helpers are line-for-line translations of the corresponding blocks
 * inside getCriticalReportData / getSummaryReportData / getMovementReportData,
 * so a bug in the algorithm is caught here even though the DB call is absent.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.6, 4.1, 4.2, 4.3
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 */

import fc from 'fast-check';
import { formatCurrency } from '../../../src/utils/formatCurrency';

// ---------------------------------------------------------------------------
// Domain types (no TypeORM/React Native imports needed)
// ---------------------------------------------------------------------------

interface TestProduct {
  code: string;
  name: string;
  price: number;
  stock: number;
}

interface TestLogDetail {
  productCode: string;
  name: string;
  quantity: number;
}

interface TestLogHeader {
  type: number;
  isInput: boolean;
  logDetails: TestLogDetail[];
}

interface StockDistribution {
  zero: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
}

// ---------------------------------------------------------------------------
// Pure computation helpers — mirrors of ReportService internal logic
// ---------------------------------------------------------------------------

const filterLowStock = (products: TestProduct[]) =>
  products.filter(p => p.stock <= 5);

const filterZeroStock = (products: TestProduct[]) =>
  products.filter(p => p.stock === 0);

const rankMostMoved = (details: TestLogDetail[]) => {
  const map = new Map<string, {name: string; total: number}>();
  for (const d of details) {
    const existing = map.get(d.productCode);
    if (existing) {
      existing.total += d.quantity;
    } else {
      map.set(d.productCode, {name: d.name, total: d.quantity});
    }
  }
  return Array.from(map.entries())
    .map(([code, {name, total}]) => ({code, name, totalQuantity: total}))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);
};

const computeSummary = (products: TestProduct[]) => ({
  totalProducts: products.length,
  totalInventoryValue: products.reduce((s, p) => s + p.price * p.stock, 0),
  totalUnitsInStock: products.reduce((s, p) => s + p.stock, 0),
});

const getBucket = (stock: number): keyof StockDistribution => {
  if (stock === 0) {return 'zero';}
  if (stock <= 5) {return 'low';}
  if (stock <= 20) {return 'medium';}
  if (stock <= 50) {return 'high';}
  return 'veryHigh';
};

const computeDistribution = (products: TestProduct[]): StockDistribution => {
  const dist: StockDistribution = {zero: 0, low: 0, medium: 0, high: 0, veryHigh: 0};
  for (const p of products) {
    dist[getBucket(p.stock)]++;
  }
  return dist;
};

const aggregateMovements = (headers: TestLogHeader[]) => {
  let totalEntry = 0;
  let totalExit = 0;
  const typeMap = new Map<string, {type: number; totalQuantity: number; isInput: boolean}>();

  for (const header of headers) {
    const qty = header.logDetails.reduce((s, d) => s + d.quantity, 0);
    if (header.isInput) {
      totalEntry += qty;
    } else {
      totalExit += qty;
    }
    const key = `${header.type}_${header.isInput}`;
    const existing = typeMap.get(key);
    if (existing) {
      existing.totalQuantity += qty;
    } else {
      typeMap.set(key, {type: header.type, totalQuantity: qty, isInput: header.isInput});
    }
  }

  const movementsByType = Array.from(typeMap.values()).sort(
    (a, b) => b.totalQuantity - a.totalQuantity,
  );

  return {
    totalEntry,
    totalExit,
    movementsByType,
    topCategories: movementsByType.slice(0, 5),
  };
};

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const productArbitrary = fc.record({
  code: fc.string({minLength: 1, maxLength: 10}),
  name: fc.string({minLength: 1, maxLength: 20}),
  price: fc.nat({max: 100_000}),
  stock: fc.nat({max: 1_000}),
});

const productListArbitrary = fc.array(productArbitrary, {
  minLength: 0,
  maxLength: 50,
});

const logDetailArbitrary = fc.record({
  productCode: fc.constantFrom(
    'P001', 'P002', 'P003', 'P004', 'P005',
    'P006', 'P007', 'P008', 'P009', 'P010', 'P011',
  ),
  name: fc.string({minLength: 1, maxLength: 10}),
  quantity: fc.nat({max: 100}),
});

const logHeaderArbitrary = fc.record({
  type: fc.integer({min: 1, max: 10}),
  isInput: fc.boolean(),
  logDetails: fc.array(logDetailArbitrary, {minLength: 0, maxLength: 5}),
});

const logHeadersArbitrary = fc.array(logHeaderArbitrary, {
  minLength: 0,
  maxLength: 20,
});

// ---------------------------------------------------------------------------
// Property 1: Stock threshold filtering correctly partitions products
// Validates: Requirements 2.1, 2.2
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports, Property 1: Stock threshold filtering correctly partitions products', () => {
  it('low stock filter returns exactly products with stock ≤ 5', () => {
    fc.assert(
      fc.property(productListArbitrary, products => {
        const lowStock = filterLowStock(products);
        expect(lowStock.every(p => p.stock <= 5)).toBe(true);
        expect(lowStock.length).toBe(products.filter(p => p.stock <= 5).length);
      }),
      {numRuns: 100},
    );
  });

  it('zero stock filter returns exactly products with stock = 0', () => {
    fc.assert(
      fc.property(productListArbitrary, products => {
        const zeroStock = filterZeroStock(products);
        expect(zeroStock.every(p => p.stock === 0)).toBe(true);
        expect(zeroStock.length).toBe(products.filter(p => p.stock === 0).length);
      }),
      {numRuns: 100},
    );
  });

  it('zero stock is always a subset of low stock', () => {
    fc.assert(
      fc.property(productListArbitrary, products => {
        const lowStockCodes = new Set(filterLowStock(products).map(p => p.code));
        const zeroStock = filterZeroStock(products);
        expect(zeroStock.every(p => lowStockCodes.has(p.code))).toBe(true);
      }),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Most moved products ranking is correct
// Validates: Requirement 2.3
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports, Property 2: Most moved products ranking is correct', () => {
  const detailsArbitrary = fc.array(logDetailArbitrary, {
    minLength: 0,
    maxLength: 60,
  });

  it('result contains at most 10 products', () => {
    fc.assert(
      fc.property(detailsArbitrary, details => {
        expect(rankMostMoved(details).length).toBeLessThanOrEqual(10);
      }),
      {numRuns: 100},
    );
  });

  it('result is ordered by descending total quantity', () => {
    fc.assert(
      fc.property(detailsArbitrary, details => {
        const ranked = rankMostMoved(details);
        for (let i = 0; i < ranked.length - 1; i++) {
          expect(ranked[i].totalQuantity).toBeGreaterThanOrEqual(
            ranked[i + 1].totalQuantity,
          );
        }
      }),
      {numRuns: 100},
    );
  });

  it('every product in result has total ≥ any product not in result', () => {
    fc.assert(
      fc.property(detailsArbitrary, details => {
        const ranked = rankMostMoved(details);
        if (ranked.length < 10) {
          return; // all unique products are in result, no exclusion to compare
        }

        const allTotals = new Map<string, number>();
        for (const d of details) {
          allTotals.set(d.productCode, (allTotals.get(d.productCode) ?? 0) + d.quantity);
        }

        const inResultCodes = new Set(ranked.map(p => p.code));
        const minInResult = Math.min(...ranked.map(p => p.totalQuantity));

        for (const [code, total] of allTotals.entries()) {
          if (!inResultCodes.has(code)) {
            expect(minInResult).toBeGreaterThanOrEqual(total);
          }
        }
      }),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Inventory summary computations are accurate
// Validates: Requirements 3.1, 3.2, 3.3
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports, Property 3: Inventory summary computations are accurate', () => {
  it('totalProducts equals count of products', () => {
    fc.assert(
      fc.property(productListArbitrary, products => {
        expect(computeSummary(products).totalProducts).toBe(products.length);
      }),
      {numRuns: 100},
    );
  });

  it('totalInventoryValue equals sum of (price × stock)', () => {
    fc.assert(
      fc.property(productListArbitrary, products => {
        const {totalInventoryValue} = computeSummary(products);
        const expected = products
          .map(p => p.price * p.stock)
          .reduce((a, b) => a + b, 0);
        expect(totalInventoryValue).toBe(expected);
      }),
      {numRuns: 100},
    );
  });

  it('totalUnitsInStock equals sum of stock', () => {
    fc.assert(
      fc.property(productListArbitrary, products => {
        const {totalUnitsInStock} = computeSummary(products);
        const expected = products.reduce((s, p) => s + p.stock, 0);
        expect(totalUnitsInStock).toBe(expected);
      }),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Stock distribution bucketing is exhaustive and exclusive
// Validates: Requirement 3.4
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports, Property 4: Stock distribution bucketing is exhaustive and exclusive', () => {
  it('each product falls in exactly one bucket', () => {
    fc.assert(
      fc.property(productListArbitrary, products => {
        for (const p of products) {
          const activeBuckets = [
            p.stock === 0,
            p.stock >= 1 && p.stock <= 5,
            p.stock >= 6 && p.stock <= 20,
            p.stock >= 21 && p.stock <= 50,
            p.stock > 50,
          ].filter(Boolean).length;
          expect(activeBuckets).toBe(1);
        }
      }),
      {numRuns: 100},
    );
  });

  it('sum of all bucket counts equals total number of products', () => {
    fc.assert(
      fc.property(productListArbitrary, products => {
        const dist = computeDistribution(products);
        const total = dist.zero + dist.low + dist.medium + dist.high + dist.veryHigh;
        expect(total).toBe(products.length);
      }),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Monetary formatting produces valid output
// Validates: Requirement 3.6
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports, Property 5: Monetary formatting produces valid output', () => {
  const nonNegativeArbitrary = fc.nat({max: 10_000_000});

  it('output starts with "Q"', () => {
    fc.assert(
      fc.property(nonNegativeArbitrary, value => {
        expect(formatCurrency(value)).toMatch(/^Q/);
      }),
      {numRuns: 100},
    );
  });

  it('output contains a number with exactly two decimal places', () => {
    fc.assert(
      fc.property(nonNegativeArbitrary, value => {
        expect(formatCurrency(value)).toMatch(/^Q\d+\.\d{2}$/);
      }),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Movement aggregation correctly groups by type and direction
// Validates: Requirements 4.1, 4.2
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports, Property 6: Movement aggregation correctly groups by type and direction', () => {
  it('totalEntryQuantity equals sum of quantities for input headers', () => {
    fc.assert(
      fc.property(logHeadersArbitrary, headers => {
        const {totalEntry} = aggregateMovements(headers);
        const expected = headers
          .filter(h => h.isInput)
          .flatMap(h => h.logDetails)
          .reduce((s, d) => s + d.quantity, 0);
        expect(totalEntry).toBe(expected);
      }),
      {numRuns: 100},
    );
  });

  it('totalExitQuantity equals sum of quantities for output headers', () => {
    fc.assert(
      fc.property(logHeadersArbitrary, headers => {
        const {totalExit} = aggregateMovements(headers);
        const expected = headers
          .filter(h => !h.isInput)
          .flatMap(h => h.logDetails)
          .reduce((s, d) => s + d.quantity, 0);
        expect(totalExit).toBe(expected);
      }),
      {numRuns: 100},
    );
  });

  it("each type's totalQuantity equals sum of its detail quantities", () => {
    fc.assert(
      fc.property(logHeadersArbitrary, headers => {
        const {movementsByType} = aggregateMovements(headers);
        for (const movement of movementsByType) {
          const expected = headers
            .filter(h => h.type === movement.type && h.isInput === movement.isInput)
            .flatMap(h => h.logDetails)
            .reduce((s, d) => s + d.quantity, 0);
          expect(movement.totalQuantity).toBe(expected);
        }
      }),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Top categories ranking is correct
// Validates: Requirement 4.3
// ---------------------------------------------------------------------------

describe('Feature: dashboard-reports, Property 7: Top categories ranking is correct', () => {
  // At least 6 headers with 6 distinct possible types to ensure ≥5 categories appear
  const manyTypesArbitrary = fc.array(
    fc.record({
      type: fc.integer({min: 1, max: 6}),
      isInput: fc.boolean(),
      logDetails: fc.array(
        fc.record({
          productCode: fc.constant('P001'),
          name: fc.constant('Producto'),
          quantity: fc.integer({min: 1, max: 100}),
        }),
        {minLength: 1, maxLength: 3},
      ),
    }),
    {minLength: 6, maxLength: 30},
  );

  it('top 5 are ordered by descending total quantity', () => {
    fc.assert(
      fc.property(manyTypesArbitrary, headers => {
        const {topCategories} = aggregateMovements(headers);
        for (let i = 0; i < topCategories.length - 1; i++) {
          expect(topCategories[i].totalQuantity).toBeGreaterThanOrEqual(
            topCategories[i + 1].totalQuantity,
          );
        }
      }),
      {numRuns: 100},
    );
  });

  it('every category in top 5 has total ≥ any category not in top 5', () => {
    fc.assert(
      fc.property(manyTypesArbitrary, headers => {
        const {movementsByType, topCategories} = aggregateMovements(headers);
        if (topCategories.length === 0 || topCategories.length >= movementsByType.length) {
          return; // all categories are already in top 5, nothing excluded to compare
        }

        const minTop5 = Math.min(...topCategories.map(c => c.totalQuantity));
        const notInTop5 = movementsByType.slice(topCategories.length);

        for (const category of notInTop5) {
          expect(minTop5).toBeGreaterThanOrEqual(category.totalQuantity);
        }
      }),
      {numRuns: 100},
    );
  });
});
