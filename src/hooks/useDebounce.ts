/**
 * useDebounce — generic value debounce hook.
 *
 * Returns a debounced copy of the provided value that only updates after the
 * given `delay` (in milliseconds) has elapsed without the source value
 * changing. While the value keeps changing within the delay window, the
 * pending update is cancelled and rescheduled, so only the final value is
 * emitted once activity settles.
 *
 * Useful for debouncing search input to avoid excessive database queries.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * useEffect(() => {
 *   // runs at most once per 300ms quiet period
 *   queryProducts(debouncedSearch);
 * }, [debouncedSearch]);
 *
 * Requirements: 9.2
 */

import { useEffect, useState } from 'react';

export const DEFAULT_DEBOUNCE_DELAY = 300;

export const useDebounce = <T>(
  value: T,
  delay: number = DEFAULT_DEBOUNCE_DELAY,
): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
