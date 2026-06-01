/**
 * Property-based tests for pagination logic.
 *
 * Feature: app-modernization
 *   Property 8: Pagination returns bounded page sizes — for any product list
 *               with length greater than 50, the pagination logic must return
 *               at most 20 items per page request, and the total number of
 *               pages must equal Math.ceil(totalItems / 20).
 *
 * Validates: Requirements 9.1, 9.2
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 *
 * Strategy: We mock the ProductRepository to simulate inventories of varying
 * sizes (always > 50 to trigger pagination). We then render the useProducts
 * hook and verify that:
 *  - The first page returns at most 20 items.
 *  - Successive loadMore() calls each return at most 20 items.
 *  - The total number of pages equals Math.ceil(total / 20).
 *  - After loading all pages, the full product list is assembled.
 */

import fc from 'fast-check';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Mock navigation focus effect as a plain useEffect.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    const ReactLib = require('react');
    ReactLib.useEffect(() => cb(), [cb]);
  },
}));

// Mock the repository so we control totals and page results.
jest.mock('../../src/database/repository/ProductRepository', () => ({
  getProductsPaged: jest.fn(),
  getTotalProducts: jest.fn(),
  searchProductsByCodeOrName: jest.fn(),
}));

// Mock LogService to avoid console noise.
jest.mock('../../src/services/LogService', () => ({
  logService: {
    logError: jest.fn(),
    getRecentLogs: jest.fn(() => []),
  },
}));

import {
    getProductsPaged,
    getTotalProducts,
} from '../../src/database/repository/ProductRepository';
import {
    PAGINATION_THRESHOLD,
    PRODUCTS_PAGE_SIZE,
    useProducts,
} from '../../src/hooks/useProducts';

const mockGetProductsPaged = getProductsPaged as jest.Mock;
const mockGetTotalProducts = getTotalProducts as jest.Mock;

type HookValue = ReturnType<typeof useProducts>;

/** Build `count` fake products with sequential codes starting at `offset`. */
const makeProducts = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    code: `P${String(offset + i).padStart(4, '0')}`,
    name: `Producto ${offset + i}`,
    description: `Descripción ${offset + i}`,
    price: (offset + i) * 10,
    stock: offset + i,
    image: '',
  }));

/**
 * Render the hook through a harness and return helpers to read its latest
 * value.
 */
const renderUseProducts = () => {
  const ref: { current: HookValue | null } = { current: null };

  const Harness = () => {
    ref.current = useProducts();
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(Harness));
  });

  return {
    get value() {
      return ref.current as HookValue;
    },
    renderer,
  };
};

/** Flush queued microtasks (chained awaits in the hook's async loaders). */
const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockGetProductsPaged.mockReset();
  mockGetTotalProducts.mockReset();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Anchor unit tests (concrete examples)
// ---------------------------------------------------------------------------

describe('Pagination — example cases', () => {
  it('returns exactly 20 items on the first page for a 75-item inventory', async () => {
    mockGetTotalProducts.mockResolvedValue(75);
    mockGetProductsPaged.mockResolvedValue(makeProducts(PRODUCTS_PAGE_SIZE));

    const hook = renderUseProducts();
    await flush();

    expect(hook.value.products).toHaveLength(PRODUCTS_PAGE_SIZE);
    expect(hook.value.isPaginated).toBe(true);
    expect(hook.value.hasMore).toBe(true);
  });

  it('total pages for 75 items is Math.ceil(75/20) = 4', async () => {
    const total = 75;
    const expectedPages = Math.ceil(total / PRODUCTS_PAGE_SIZE);
    expect(expectedPages).toBe(4);

    mockGetTotalProducts.mockResolvedValue(total);
    mockGetProductsPaged.mockImplementation(async (skip: number, take: number) => {
      const remaining = total - skip;
      const count = Math.min(take, remaining);
      return makeProducts(count, skip);
    });

    const hook = renderUseProducts();
    await flush();

    // Load all pages
    let pagesLoaded = 1;
    while (hook.value.hasMore) {
      await act(async () => {
        hook.value.loadMore();
      });
      await flush();
      pagesLoaded++;
    }

    expect(pagesLoaded).toBe(expectedPages);
    expect(hook.value.products).toHaveLength(total);
  });
});

// ---------------------------------------------------------------------------
// Property 8: Pagination returns bounded page sizes
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 8: Pagination returns bounded page sizes', () => {
  it('for any inventory > 50 items, each page returns at most 20 items and total pages equals Math.ceil(total / 20)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate total product counts > PAGINATION_THRESHOLD (51..300)
        fc.integer({ min: PAGINATION_THRESHOLD + 1, max: 300 }),
        async (totalItems) => {
          jest.clearAllMocks();
          mockGetProductsPaged.mockReset();
          mockGetTotalProducts.mockReset();

          const expectedTotalPages = Math.ceil(totalItems / PRODUCTS_PAGE_SIZE);

          // Mock repository to return correct slices
          mockGetTotalProducts.mockResolvedValue(totalItems);
          mockGetProductsPaged.mockImplementation(
            async (skip: number, take: number) => {
              const remaining = totalItems - skip;
              const count = Math.min(take, Math.max(0, remaining));
              return makeProducts(count, skip);
            },
          );

          const hook = renderUseProducts();
          await flush();

          // First page: at most PRODUCTS_PAGE_SIZE items
          expect(hook.value.products.length).toBeLessThanOrEqual(
            PRODUCTS_PAGE_SIZE,
          );
          expect(hook.value.isPaginated).toBe(true);

          // Load all remaining pages, tracking page sizes
          const pageSizes: number[] = [hook.value.products.length];
          let pagesLoaded = 1;

          while (hook.value.hasMore && pagesLoaded < expectedTotalPages + 1) {
            const prevLength = hook.value.products.length;
            await act(async () => {
              hook.value.loadMore();
            });
            await flush();
            const newItems = hook.value.products.length - prevLength;
            pageSizes.push(newItems);
            pagesLoaded++;
          }

          // Verify: total pages matches expected
          expect(pagesLoaded).toBe(expectedTotalPages);

          // Verify: every page has at most 20 items
          for (const pageSize of pageSizes) {
            expect(pageSize).toBeLessThanOrEqual(PRODUCTS_PAGE_SIZE);
            expect(pageSize).toBeGreaterThanOrEqual(0);
          }

          // Verify: all items are loaded
          expect(hook.value.products).toHaveLength(totalItems);

          // Verify: no more pages available
          expect(hook.value.hasMore).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('the last page contains at most 20 items and exactly the remainder', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: PAGINATION_THRESHOLD + 1, max: 200 }),
        async (totalItems) => {
          jest.clearAllMocks();
          mockGetProductsPaged.mockReset();
          mockGetTotalProducts.mockReset();

          const expectedLastPageSize = totalItems % PRODUCTS_PAGE_SIZE || PRODUCTS_PAGE_SIZE;

          mockGetTotalProducts.mockResolvedValue(totalItems);
          mockGetProductsPaged.mockImplementation(
            async (skip: number, take: number) => {
              const remaining = totalItems - skip;
              const count = Math.min(take, Math.max(0, remaining));
              return makeProducts(count, skip);
            },
          );

          const hook = renderUseProducts();
          await flush();

          // Load all pages
          const pageSizes: number[] = [hook.value.products.length];
          while (hook.value.hasMore) {
            const prevLength = hook.value.products.length;
            await act(async () => {
              hook.value.loadMore();
            });
            await flush();
            pageSizes.push(hook.value.products.length - prevLength);
          }

          // The last page should have exactly the expected remainder
          const lastPageSize = pageSizes[pageSizes.length - 1];
          expect(lastPageSize).toBe(expectedLastPageSize);
          expect(lastPageSize).toBeLessThanOrEqual(PRODUCTS_PAGE_SIZE);
        },
      ),
      { numRuns: 100 },
    );
  });
});
