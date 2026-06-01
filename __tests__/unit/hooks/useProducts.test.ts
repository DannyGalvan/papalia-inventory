/**
 * Unit tests for the `useProducts` hook (task 8.2).
 *
 * Covers:
 *  - Non-paginated loading when the total is <= 50 (whole list in one call).
 *  - Pagination (page size 20) when the total is > 50, with `hasMore`.
 *  - `loadMore()` appending the next page and advancing the cursor.
 *  - `loadMore()` being a guarded no-op when there are no more pages.
 *  - Debounced search (300ms) routing through `searchProductsByCodeOrName`.
 *  - Error handling: failures set the `error` state and are logged via
 *    LogService instead of using `Alert.alert`.
 *
 * Uses react-test-renderer (the project's configured renderer) with a tiny
 * harness component that exposes the hook's latest return value. The
 * navigation `useFocusEffect` is mocked to a plain effect, and the repository
 * is mocked so the hook's pagination/search/error logic is exercised directly.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.6
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Run the focus callback as a normal effect (no NavigationContainer needed).
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    const ReactLib = require('react');
    ReactLib.useEffect(() => cb(), [cb]);
  },
}));

// Mock the repository so we control totals, pages, and failures.
jest.mock('../../../src/database/repository/ProductRepository', () => ({
  getProductsPaged: jest.fn(),
  getTotalProducts: jest.fn(),
  searchProductsByCodeOrName: jest.fn(),
}));

import {
    getProductsPaged,
    getTotalProducts,
    searchProductsByCodeOrName,
} from '../../../src/database/repository/ProductRepository';
import {
    PRODUCTS_PAGE_SIZE,
    PRODUCT_LIST_PERFORMANCE_PROPS,
    useProducts
} from '../../../src/hooks/useProducts';
import { logService } from '../../../src/services/LogService';

const mockGetProductsPaged = getProductsPaged as jest.Mock;
const mockGetTotalProducts = getTotalProducts as jest.Mock;
const mockSearch = searchProductsByCodeOrName as jest.Mock;

type HookValue = ReturnType<typeof useProducts>;

/** Build `count` fake products with sequential codes (optionally offset). */
const makeProducts = (count: number, offset = 0) =>
  Array.from({length: count}, (_, i) => ({
    code: `P${offset + i}`,
    name: `Producto ${offset + i}`,
    description: '',
    price: 1,
    stock: 1,
    image: '',
  }));

/**
 * Render the hook through a harness and return helpers to read its latest
 * value and to flush pending promise microtasks.
 */
const renderUseProducts = () => {
  const ref: {current: HookValue | null} = {current: null};

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

describe('useProducts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetProductsPaged.mockReset();
    mockGetTotalProducts.mockReset();
    mockSearch.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('exposes FlatList performance props aligned with the page size', () => {
    expect(PRODUCT_LIST_PERFORMANCE_PROPS.initialNumToRender).toBe(
      PRODUCTS_PAGE_SIZE,
    );
    expect(PRODUCT_LIST_PERFORMANCE_PROPS.maxToRenderPerBatch).toBe(
      PRODUCTS_PAGE_SIZE,
    );
    expect(PRODUCT_LIST_PERFORMANCE_PROPS.windowSize).toBeGreaterThan(0);
  });

  it('loads the whole list in one request when total <= 50', async () => {
    mockGetTotalProducts.mockResolvedValue(10);
    mockGetProductsPaged.mockResolvedValue(makeProducts(10));

    const hook = renderUseProducts();
    await flush();

    expect(mockGetProductsPaged).toHaveBeenCalledWith(0, 10);
    expect(hook.value.products).toHaveLength(10);
    expect(hook.value.total).toBe(10);
    expect(hook.value.isPaginated).toBe(false);
    expect(hook.value.hasMore).toBe(false);
  });

  it('loads only the first page of 20 when total > 50', async () => {
    mockGetTotalProducts.mockResolvedValue(75);
    mockGetProductsPaged.mockResolvedValue(makeProducts(PRODUCTS_PAGE_SIZE));

    const hook = renderUseProducts();
    await flush();

    expect(mockGetProductsPaged).toHaveBeenCalledWith(0, PRODUCTS_PAGE_SIZE);
    expect(hook.value.products).toHaveLength(PRODUCTS_PAGE_SIZE);
    expect(hook.value.isPaginated).toBe(true);
    expect(hook.value.hasMore).toBe(true);
  });

  it('appends the next page when loadMore is called', async () => {
    mockGetTotalProducts.mockResolvedValue(75);
    mockGetProductsPaged
      .mockResolvedValueOnce(makeProducts(PRODUCTS_PAGE_SIZE, 0))
      .mockResolvedValueOnce(makeProducts(PRODUCTS_PAGE_SIZE, 20));

    const hook = renderUseProducts();
    await flush();
    expect(hook.value.products).toHaveLength(PRODUCTS_PAGE_SIZE);

    await act(async () => {
      hook.value.loadMore();
    });
    await flush();

    expect(mockGetProductsPaged).toHaveBeenLastCalledWith(
      PRODUCTS_PAGE_SIZE,
      PRODUCTS_PAGE_SIZE,
    );
    expect(hook.value.products).toHaveLength(2 * PRODUCTS_PAGE_SIZE);
  });

  it('does not load more once all items are loaded', async () => {
    // 60 total: first page 20, second page 20, third page 20 -> exhausted.
    mockGetTotalProducts.mockResolvedValue(60);
    mockGetProductsPaged
      .mockResolvedValueOnce(makeProducts(20, 0))
      .mockResolvedValueOnce(makeProducts(20, 20))
      .mockResolvedValueOnce(makeProducts(20, 40));

    const hook = renderUseProducts();
    await flush();

    await act(async () => {
      hook.value.loadMore();
    });
    await flush();
    await act(async () => {
      hook.value.loadMore();
    });
    await flush();

    expect(hook.value.products).toHaveLength(60);
    expect(hook.value.hasMore).toBe(false);

    const callsAfterFull = mockGetProductsPaged.mock.calls.length;
    // Further loadMore calls must be guarded no-ops.
    await act(async () => {
      hook.value.loadMore();
    });
    await flush();
    expect(mockGetProductsPaged.mock.calls.length).toBe(callsAfterFull);
  });

  it('debounces search input before querying the repository', async () => {
    mockGetTotalProducts.mockResolvedValue(10);
    mockGetProductsPaged.mockResolvedValue(makeProducts(10));
    mockSearch.mockResolvedValue(makeProducts(3, 100));

    const hook = renderUseProducts();
    await flush();

    // Rapid keystrokes within the debounce window.
    act(() => {
      hook.value.searchProducts('a');
      hook.value.searchProducts('ab');
      hook.value.searchProducts('abc');
    });

    // Before the debounce elapses, no search query should have fired.
    expect(mockSearch).not.toHaveBeenCalled();

    // Advance past the 300ms debounce, then let the load resolve.
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await flush();

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith('abc');
    expect(hook.value.products).toHaveLength(3);
  });

  it('surfaces a Spanish error and logs it when loading fails', async () => {
    const logSpy = jest.spyOn(logService, 'logError');
    mockGetTotalProducts.mockResolvedValue(10);
    mockGetProductsPaged.mockRejectedValue(new Error('db boom'));

    const hook = renderUseProducts();
    await flush();
    // withRetry waits 500ms before its single retry, which also fails.
    act(() => {
      jest.advanceTimersByTime(600);
    });
    await flush();

    expect(hook.value.error).toBeTruthy();
    expect(logSpy).toHaveBeenCalled();
    // withRetry logs the technical failure first; the hook then logs its own
    // contextual entry. Assert the hook's entry is present.
    const sources = logSpy.mock.calls.map(call => call[0].source);
    expect(sources).toContain('useProducts');

    logSpy.mockRestore();
  });
});
