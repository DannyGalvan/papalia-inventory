/**
 * Database operation retry wrapper.
 *
 * Wraps an asynchronous operation (typically a database query) so that it is
 * attempted exactly twice: an initial attempt followed by a single retry after
 * a short delay. If the retry also fails, the error is logged via the shared
 * {@link logService} and a sanitized, user-facing error carrying only the
 * provided `fallbackMessage` is thrown — never the underlying technical
 * details.
 *
 * Requirements: 9.5, 10.2
 */

import { logService } from '../services/LogService';

/** Delay, in milliseconds, between the initial attempt and the retry. */
const RETRY_DELAY_MS = 500;

/**
 * Resolve after the given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute `operation`, retrying once if the first attempt fails.
 *
 * The operation is attempted a maximum of two times total (initial attempt +
 * one retry). A {@link RETRY_DELAY_MS}ms delay separates the two attempts. If
 * both attempts fail, the second error is recorded through {@link logService}
 * and an `Error` carrying the `fallbackMessage` is thrown so the caller can
 * surface a user-friendly message without exposing technical details.
 *
 * @typeParam T The resolved value type of the operation.
 * @param operation The asynchronous operation to execute.
 * @param fallbackMessage A safe Spanish-language message describing the failed
 *   operation, used both for logging and as the thrown error's message.
 * @returns The resolved value of the operation if either attempt succeeds.
 * @throws {Error} With `fallbackMessage` as its message if both attempts fail.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  fallbackMessage: string,
): Promise<T> {
  try {
    return await operation();
  } catch (firstError) {
    // Wait briefly, then retry the operation exactly once.
    await delay(RETRY_DELAY_MS);

    try {
      return await operation();
    } catch (secondError) {
      const err = secondError as Error;
      logService.logError({
        errorType: err?.name || 'DatabaseError',
        source: 'withRetry',
        operation: fallbackMessage,
        message: err?.message || '',
      });
      throw new Error(fallbackMessage);
    }
  }
}
