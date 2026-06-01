/**
 * Error message sanitization utility.
 *
 * User-facing error messages must never leak technical implementation
 * details such as SQL statements, JavaScript stack traces, TypeScript/JS
 * class names, or source file paths. {@link sanitizeErrorMessage} inspects an
 * error's message for these technical patterns and, when any are present,
 * returns a safe Spanish-language fallback message instead of the raw error
 * text.
 *
 * Requirements: 10.2
 */

/**
 * Patterns that indicate an error message contains technical details which
 * should not be surfaced to the user.
 */
const TECHNICAL_PATTERNS: RegExp[] = [
  /at\s+\w+\s+\(/, // stack trace lines (e.g. "at fn (...)")
  /SELECT|INSERT|UPDATE|DELETE|ALTER/i, // SQL statements
  /\.tsx?:\d+/, // file paths with line numbers (e.g. "file.ts:42")
  /Error:\s*\w+Error/, // error class names (e.g. "Error: TypeError")
];

/**
 * Return a user-safe error message.
 *
 * If the supplied error's message contains technical content (SQL, stack
 * traces, class names, or file paths) the provided `fallbackMessage` is
 * returned. Otherwise the original (already user-friendly) message is
 * returned unchanged.
 *
 * @param error The caught error to inspect.
 * @param fallbackMessage A safe Spanish-language message describing the
 *   failed operation (e.g. "No se pudo guardar el producto").
 * @returns A message safe to display to the user.
 */
export function sanitizeErrorMessage(
  error: Error,
  fallbackMessage: string,
): string {
  const message = error?.message || '';
  const hasTechnicalContent = TECHNICAL_PATTERNS.some(pattern =>
    pattern.test(message),
  );

  return hasTechnicalContent ? fallbackMessage : message;
}
