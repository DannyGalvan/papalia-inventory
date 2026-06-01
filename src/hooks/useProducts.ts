/**
 * useProducts — product list state with pagination, debounced search and
 * standardized error handling.
 *
 * Behavior:
 *  - Loads the product list on screen focus and whenever the (debounced)
 *    search term settles.
 *  - When the total number of products exceeds {@link PAGINATION_THRESHOLD}
 *    (50), products are loaded incrementally in pages of
 *    {@link PRODUCTS_PAGE_SIZE} (20). `loadMore()` (wired to a FlatList's
 *    `onEndReached`) appends the next page. When the total is 50 or fewer, the
 *    whole list is loaded at once (Requirement 9.1).
 *  - Search input is debounced by {@link DEFAULT_DEBOUNCE_DELAY} (300ms) via
 *    {@link useDebounce} so a database query fires at most once per quiet
 *    period (Requirement 9.2).
 *  - Database reads go through {@link withRetry} (one retry, Requirement 9.5)
 *    and failures are recorded through the shared {@link logService} while a
 *    Spanish, user-facing message is exposed via the `error` state for the
 *    screen to render in a Toast — replacing the previous `Alert.alert` calls
 *    (Requirements 9.3, 9.6, 10.2).
 *
 * Requirements: 9.1, 9.2, 9.3, 9.6
 */

import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Product } from '../database/models/Product';
import {
    getProductsPaged,
    getTotalProducts,
    searchProductsByCodeOrName,
} from '../database/repository/ProductRepository';
import { logService } from '../services/LogService';
import { withRetry } from '../utils/withRetry';
import { DEFAULT_DEBOUNCE_DELAY, useDebounce } from './useDebounce';

/** Number of products fetched per page once pagination is active. */
export const PRODUCTS_PAGE_SIZE = 20;

/**
 * Pagination only kicks in for lists larger than this. At or below this size
 * the whole list is loaded in a single request (Requirement 9.1).
 */
export const PAGINATION_THRESHOLD = 50;

/**
 * Recommended FlatList performance props for the product list. The screen
 * (task 12.1) can spread these onto its `<FlatList>` so windowing matches the
 * pagination page size and only nearby rows are rendered (Requirements 9.1,
 * 9.7). Exposed from the hook so the values stay in sync with the page size.
 */
export const PRODUCT_LIST_PERFORMANCE_PROPS = {
  initialNumToRender: PRODUCTS_PAGE_SIZE,
  maxToRenderPerBatch: PRODUCTS_PAGE_SIZE,
  windowSize: 11,
  removeClippedSubviews: true,
} as const;

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Raw search term updated by the UI; the debounced copy is what actually
  // drives database queries (Requirement 9.2).
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, DEFAULT_DEBOUNCE_DELAY);

  /** True while a non-empty search term is active. */
  const isSearching = debouncedSearch.trim().length > 0;

  /** Pagination is only active for large, unfiltered lists. */
  const isPaginated = !isSearching && total > PAGINATION_THRESHOLD;

  /** Whether another page can still be appended via {@link loadMore}. */
  const hasMore = useMemo(
    () => isPaginated && products.length < total,
    [isPaginated, products.length, total],
  );

  /**
   * Record a failure and expose a Spanish, user-facing message. The technical
   * details are already logged by {@link withRetry}; this adds the hook as the
   * source for traceability and drives the screen's Toast via `error`.
   */
  const handleError = useCallback((operation: string, e: unknown) => {
    const message = (e as Error)?.message || operation;
    logService.logError({
      errorType: (e as Error)?.name || 'ProductLoadError',
      source: 'useProducts',
      operation,
      message,
    });
    setError(message);
  }, []);

  /**
   * Load (or reload) the first page of products. Reused on focus, pull to
   * refresh, and whenever the debounced search term changes.
   */
  const loadFirstPage = useCallback(() => {
    const operation = 'No se pudieron cargar los productos';
    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const totalProducts = await withRetry(
          () => getTotalProducts(),
          'No se pudo obtener el total de productos',
        );
        setTotal(totalProducts);

        const term = debouncedSearch.trim();
        let data: Product[];

        if (term.length > 0) {
          data = await withRetry(
            () => searchProductsByCodeOrName(term),
            'No se pudo realizar la búsqueda de productos',
          );
        } else if (totalProducts > PAGINATION_THRESHOLD) {
          data = await withRetry(
            () => getProductsPaged(0, PRODUCTS_PAGE_SIZE),
            operation,
          );
        } else if (totalProducts > 0) {
          data = await withRetry(
            () => getProductsPaged(0, totalProducts),
            operation,
          );
        } else {
          data = [];
        }

        setProducts(data);
        setPage(0);
      } catch (e) {
        handleError(operation, e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [debouncedSearch, handleError]);

  /**
   * Append the next page of products. Guarded so it is a no-op while a load is
   * already in flight, when pagination is inactive, or when there are no more
   * pages — safe to wire directly to FlatList's `onEndReached`.
   */
  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    const operation = 'No se pudieron cargar más productos';

    (async () => {
      try {
        setIsLoadingMore(true);
        setError(null);

        const data = await withRetry(
          () => getProductsPaged(nextPage * PRODUCTS_PAGE_SIZE, PRODUCTS_PAGE_SIZE),
          operation,
        );

        // Functional update keeps existing item references stable so already
        // rendered rows are not recreated (Requirement 9.6).
        setProducts(prev => [...prev, ...data]);
        setPage(nextPage);
      } catch (e) {
        handleError(operation, e);
      } finally {
        setIsLoadingMore(false);
      }
    })();
  }, [isLoading, isLoadingMore, hasMore, page, handleError]);

  // Reload on focus and whenever the debounced search term settles. Because
  // `loadFirstPage` depends on `debouncedSearch`, a settled search re-runs this
  // effect while the screen is focused.
  useFocusEffect(
    useCallback(() => {
      loadFirstPage();
    }, [loadFirstPage]),
  );

  /**
   * Update the search term. The actual query is debounced via
   * {@link useDebounce}, so callers may invoke this on every keystroke.
   * Kept named `searchProducts` for backward compatibility with existing
   * consumers (e.g. `InputSearch`'s `updateFn`).
   */
  const searchProducts = useCallback((value: string) => {
    setSearch(value);
  }, []);

  /** Clear the current user-facing error (e.g. when the Toast is dismissed). */
  const clearError = useCallback(() => setError(null), []);

  return {
    products,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    isPaginated,
    error,
    search,
    loadData: loadFirstPage,
    loadMore,
    searchProducts,
    clearError,
  };
};
