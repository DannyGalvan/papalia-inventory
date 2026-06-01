/**
 * Property-based tests for user-facing error message sanitization.
 *
 * Feature: app-modernization
 *   Property 12: User-facing error messages exclude technical details — for
 *                any Error processed by the error handling system, the
 *                resulting user-facing message must not contain SQL
 *                statements, JavaScript stack traces, TypeScript class names,
 *                or file paths. It must only contain a Spanish-language
 *                description of the failed operation.
 *
 * Validates: Requirements 10.2, 10.5
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 */

import fc from 'fast-check';
import { sanitizeErrorMessage } from '../../../src/utils/sanitizeErrorMessage';

// ---------------------------------------------------------------------------
// Technical-content detection (mirrors the patterns the sanitizer must guard
// against). These are used by the test as an INDEPENDENT oracle so the
// assertions do not simply re-run the implementation under test.
// ---------------------------------------------------------------------------

/** Patterns that represent technical detail that must never reach the user. */
const TECHNICAL_PATTERNS: RegExp[] = [
  /at\s+\w+\s+\(/, // stack trace lines (e.g. "at fn (...)")
  /SELECT|INSERT|UPDATE|DELETE|ALTER/i, // SQL statements
  /\.tsx?:\d+/, // file paths with line numbers (e.g. "file.ts:42")
  /Error:\s*\w+Error/, // error class names (e.g. "Error: TypeError")
];

/** True when `text` contains any technical-detail pattern. */
const hasTechnicalContent = (text: string): boolean =>
  TECHNICAL_PATTERNS.some(pattern => pattern.test(text));

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Safe Spanish-language fallback messages describing failed operations. These
 * are deliberately free of any technical-detail patterns and are what the
 * sanitizer should surface whenever the raw error leaks technical content.
 */
const SPANISH_FALLBACKS = [
  'No se pudo guardar el producto',
  'No se pudo completar la operación',
  'No se pudo iniciar la base de datos',
  'No se pudo guardar el archivo',
  'No se pudo leer el archivo',
  'Ocurrió un error inesperado',
  'No se pudo cargar la lista de productos',
  'No se pudo registrar el movimiento de inventario',
];

const fallbackArbitrary = fc.constantFrom(...SPANISH_FALLBACKS);

/** A short alphabetic identifier (used to build technical fragments). */
const identifierArbitrary = fc
  .stringMatching(/^[a-zA-Z]{1,12}$/)
  .filter(s => s.length > 0);

/** Generates a fragment that embeds at least one technical-detail pattern. */
const technicalFragmentArbitrary: fc.Arbitrary<string> = fc.oneof(
  // SQL statements (case-insensitive keyword match).
  fc
    .tuple(
      fc.constantFrom('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALTER'),
      identifierArbitrary,
    )
    .map(([keyword, table]) => `${keyword} * FROM ${table}`),
  // Lowercase SQL keyword to exercise the case-insensitive flag.
  fc
    .constantFrom('select', 'insert', 'update', 'delete', 'alter')
    .map(keyword => `${keyword} table_name`),
  // JavaScript stack-trace lines.
  fc
    .tuple(identifierArbitrary, identifierArbitrary)
    .map(([fn, file]) => `at ${fn} (${file}.js:10:5)`),
  // File paths with line numbers (.ts / .tsx).
  fc
    .tuple(identifierArbitrary, fc.constantFrom('ts', 'tsx'), fc.integer({min: 1, max: 9999}))
    .map(([file, ext, line]) => `${file}.${ext}:${line}`),
  // Error class names.
  fc
    .constantFrom('Type', 'Range', 'Syntax', 'Reference', 'Eval', 'URI')
    .map(kind => `Error: ${kind}Error`),
);

/**
 * Spanish text that is guaranteed not to contain technical-detail patterns.
 * Generated freely then filtered through the oracle so the input space stays
 * within "clean" messages.
 */
const cleanMessageArbitrary: fc.Arbitrary<string> = fc
  .oneof(
    fc.constantFrom(...SPANISH_FALLBACKS),
    fc.constantFrom(
      'El producto no existe',
      'La cantidad debe ser mayor que cero',
      'Seleccione una opción válida',
      'Conexión perdida con el servidor',
      'El campo nombre es obligatorio',
      'No hay inventario disponible',
    ),
    // Arbitrary unicode text, restricted to non-technical content below.
    fc.string({minLength: 0, maxLength: 80}),
  )
  .filter(message => !hasTechnicalContent(message));

/**
 * A leaky error message: an injected technical fragment optionally wrapped in
 * clean Spanish prose. By construction it always contains technical content.
 */
const leakyMessageArbitrary: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom('', 'No se pudo guardar el producto. ', 'Detalle: ', 'Fallo: '),
    technicalFragmentArbitrary,
    fc.constantFrom('', ' Intente nuevamente.', ' al ejecutar la consulta.'),
  )
  .map(([prefix, technical, suffix]) => `${prefix}${technical}${suffix}`)
  // Guard: the construction must actually contain technical content.
  .filter(message => hasTechnicalContent(message));

// ---------------------------------------------------------------------------
// Anchor unit tests (concrete examples for each technical category)
// ---------------------------------------------------------------------------

describe('sanitizeErrorMessage — technical-detail examples', () => {
  const fallback = 'No se pudo completar la operación';

  it('strips SQL statements', () => {
    const result = sanitizeErrorMessage(
      new Error('SELECT * FROM log_header WHERE id = 1'),
      fallback,
    );
    expect(result).toBe(fallback);
    expect(hasTechnicalContent(result)).toBe(false);
  });

  it('strips JavaScript stack traces', () => {
    const result = sanitizeErrorMessage(
      new Error('boom at saveProduct (ProductRepository.js:42:17)'),
      fallback,
    );
    expect(result).toBe(fallback);
  });

  it('strips file paths with line numbers', () => {
    const result = sanitizeErrorMessage(
      new Error('crash in ExcelService.ts:128'),
      fallback,
    );
    expect(result).toBe(fallback);
  });

  it('strips error class names', () => {
    const result = sanitizeErrorMessage(
      new Error('Error: TypeError occurred'),
      fallback,
    );
    expect(result).toBe(fallback);
  });

  it('passes through a clean Spanish message unchanged', () => {
    const clean = 'No se pudo guardar el producto';
    expect(sanitizeErrorMessage(new Error(clean), fallback)).toBe(clean);
  });
});

// ---------------------------------------------------------------------------
// Property 12: User-facing error messages exclude technical details
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 12: User-facing error messages exclude technical details', () => {
  it('replaces any message containing technical details with the Spanish fallback', () => {
    fc.assert(
      fc.property(leakyMessageArbitrary, fallbackArbitrary, (leaky, fallback) => {
        const result = sanitizeErrorMessage(new Error(leaky), fallback);

        // The leaked technical message must be suppressed in favor of the
        // safe Spanish fallback.
        expect(result).toBe(fallback);
        // And the surfaced message must carry no technical-detail patterns.
        expect(hasTechnicalContent(result)).toBe(false);
      }),
      {numRuns: 100},
    );
  });

  it('never surfaces technical content regardless of the raw error message', () => {
    fc.assert(
      fc.property(
        fc.oneof(leakyMessageArbitrary, cleanMessageArbitrary),
        fallbackArbitrary,
        (rawMessage, fallback) => {
          const result = sanitizeErrorMessage(new Error(rawMessage), fallback);

          // Universal guarantee: the user-facing output is always free of
          // SQL / stack traces / file paths / error class names.
          expect(hasTechnicalContent(result)).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });

  it('passes clean Spanish messages through unchanged', () => {
    fc.assert(
      fc.property(cleanMessageArbitrary, fallbackArbitrary, (clean, fallback) => {
        const result = sanitizeErrorMessage(new Error(clean), fallback);

        // A non-technical message must be preserved verbatim.
        expect(result).toBe(clean);
      }),
      {numRuns: 100},
    );
  });
});
