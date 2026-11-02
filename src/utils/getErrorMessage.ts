/**
 * Extract a readable message from a value thrown in a `catch` block.
 * Thrown values are `unknown`; only Error-like objects carry a message.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message
  ) {
    return error.message;
  }
  return fallback;
};

/** Read the `name` of a thrown value when it is Error-like. */
export const getErrorName = (error: unknown, fallback: string): string =>
  error instanceof Error && error.name ? error.name : fallback;
