/**
 * Property-based tests for the database retry wrapper.
 *
 * Feature: app-modernization
 *   Property 10: Database retry executes exactly once before surfacing error —
 *                for any database operation that throws an error, the retry
 *                wrapper must attempt the operation exactly twice total
 *                (initial + one retry). If both attempts fail, the user-facing
 *                error must be surfaced. If the retry succeeds, no error is
 *                shown.
 *
 * Validates: Requirements 9.5
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 *
 * Timing note: `withRetry` waits 500ms (via setTimeout) between the initial
 * attempt and the retry. To keep all 100 iterations fast we drive Jest's modern
 * fake timers with `advanceTimersByTimeAsync`, so no real time elapses while the
 * retry delay is "waited" for. The number of attempts is observed through the
 * mock operation's call count.
 */

import fc from 'fast-check';

// The shared logService singleton is mocked so we can (a) assert when an error
// is surfaced/logged and (b) avoid real console output during the run.
jest.mock('../../../src/services/LogService', () => ({
  logService: {
    logError: jest.fn(),
    getRecentLogs: jest.fn(() => []),
  },
}));

import { logService } from '../../../src/services/LogService';
import { withRetry } from '../../../src/utils/withRetry';

/** Mirrors the delay constant inside withRetry (initial attempt + one retry). */
const RETRY_DELAY_MS = 500;

const mockedLogError = logService.logError as jest.Mock;

/**
 * Build a mock async operation that throws on its first `failCount` calls and
 * then resolves with `successValue` on every subsequent call.
 */
function makeOperation<T>(failCount: number, successValue: T): jest.Mock {
  let calls = 0;
  return jest.fn(async () => {
    calls += 1;
    if (calls <= failCount) {
      // Deliberately "technical" message to confirm it is never surfaced.
      throw new Error(`SELECT * FROM log_header at run (DataSource.ts:${calls})`);
    }
    return successValue;
  });
}

/**
 * Run `withRetry`, advancing fake timers so the (possible) retry delay elapses,
 * and report whether it resolved or rejected. A rejection handler is attached
 * synchronously to avoid unhandled-rejection warnings.
 */
async function runWithRetry<T>(
  operation: () => Promise<T>,
  fallback: string,
): Promise<{status: 'resolved'; value: T} | {status: 'rejected'; error: Error}> {
  const settled = withRetry(operation, fallback).then(
    value => ({status: 'resolved' as const, value}),
    error => ({status: 'rejected' as const, error: error as Error}),
  );
  // Let the initial attempt settle and the retry delay (if any) elapse.
  await jest.advanceTimersByTimeAsync(RETRY_DELAY_MS);
  return settled;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockedLogError.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Anchor unit tests (concrete examples for each branch)
// ---------------------------------------------------------------------------

describe('withRetry — example cases', () => {
  const fallback = 'No se pudo completar la operación';

  it('attempts exactly once and resolves when the first attempt succeeds', async () => {
    const operation = makeOperation(0, 'ok');
    const outcome = await runWithRetry(operation, fallback);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({status: 'resolved', value: 'ok'});
    expect(mockedLogError).not.toHaveBeenCalled();
  });

  it('attempts exactly twice and resolves when the retry succeeds', async () => {
    const operation = makeOperation(1, 'recovered');
    const outcome = await runWithRetry(operation, fallback);

    expect(operation).toHaveBeenCalledTimes(2);
    expect(outcome).toEqual({status: 'resolved', value: 'recovered'});
    // No error surfaced when the retry succeeds.
    expect(mockedLogError).not.toHaveBeenCalled();
  });

  it('attempts exactly twice and surfaces the fallback error when both fail', async () => {
    const operation = makeOperation(Infinity, 'never');
    const outcome = await runWithRetry(operation, fallback);

    expect(operation).toHaveBeenCalledTimes(2);
    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') {
      // Only the safe fallback is surfaced — never the technical message.
      expect(outcome.error).toBeInstanceOf(Error);
      expect(outcome.error.message).toBe(fallback);
    }
    expect(mockedLogError).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Property 10: Database retry executes exactly once before surfacing error
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 10: Database retry executes exactly once before surfacing error', () => {
  /** Spanish fallback messages safe to surface to the user. */
  const fallbackArb = fc.constantFrom(
    'No se pudo completar la operación',
    'No se pudo guardar el producto',
    'No se pudo cargar la lista de productos',
    'No se pudo iniciar la base de datos',
  );

  /** Value the operation resolves with once it stops failing. */
  const successArb = fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.record({id: fc.integer(), name: fc.string()}),
  );

  it('always attempts at most twice; surfaces the fallback error only when both attempts fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        // failCount: how many leading attempts throw (0..3 covers success,
        // retry-recovery, and total-failure scenarios).
        fc.nat({max: 3}),
        successArb,
        fallbackArb,
        async (failCount, successValue, fallback) => {
          mockedLogError.mockClear();
          const operation = makeOperation(failCount, successValue);

          const outcome = await runWithRetry(operation, fallback);

          const succeeds = failCount <= 1; // initial + one retry only

          if (succeeds) {
            // Exactly failCount + 1 attempts (1 when it succeeds first try,
            // 2 when the single retry recovers it).
            expect(operation).toHaveBeenCalledTimes(failCount + 1);
            expect(outcome).toEqual({status: 'resolved', value: successValue});
            // No error is surfaced or logged when the operation ultimately
            // succeeds.
            expect(mockedLogError).not.toHaveBeenCalled();
          } else {
            // The operation is attempted EXACTLY twice (initial + one retry)
            // before the error is surfaced — never a third time.
            expect(operation).toHaveBeenCalledTimes(2);
            expect(outcome.status).toBe('rejected');
            if (outcome.status === 'rejected') {
              expect(outcome.error).toBeInstanceOf(Error);
              // The surfaced message is the safe fallback, not the technical
              // error thrown by the operation.
              expect(outcome.error.message).toBe(fallback);
            }
            // The failure is surfaced exactly once via the log service.
            expect(mockedLogError).toHaveBeenCalledTimes(1);
          }
        },
      ),
      {numRuns: 100},
    );
  });
});
