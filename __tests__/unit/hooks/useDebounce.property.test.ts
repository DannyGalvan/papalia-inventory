/**
 * Property-based tests for the useDebounce hook.
 *
 * Feature: app-modernization
 *   Property 9: Debounce suppresses intermediate calls — for any sequence of
 *               N search input events arriving within 300ms of each other,
 *               exactly one database query must be triggered (for the final
 *               input value), and it must fire no earlier than 300ms after the
 *               last input event.
 *
 * Validates: Requirements 9.2
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 *
 * Strategy: We render the useDebounce hook through a harness component and
 * simulate rapid value changes within the debounce window. We then verify that
 * the debounced value only updates once (to the final value) after the delay
 * elapses — confirming intermediate values are suppressed.
 */

import fc from 'fast-check';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { DEFAULT_DEBOUNCE_DELAY, useDebounce } from '../../../src/hooks/useDebounce';

type HarnessProps = { value: string; delay?: number };
type HarnessRef = { debouncedValue: string };

/**
 * Harness component that exposes the debounced value via a ref-like object.
 */
function createHarness() {
  const ref: { current: HarnessRef } = { current: { debouncedValue: '' } };

  const Harness: React.FC<HarnessProps> = ({ value, delay }) => {
    const debouncedValue = useDebounce(value, delay);
    ref.current = { debouncedValue };
    return null;
  };

  return { Harness, ref };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Anchor unit tests (concrete examples)
// ---------------------------------------------------------------------------

describe('useDebounce — example cases', () => {
  it('returns the initial value immediately', () => {
    const { Harness, ref } = createHarness();
    act(() => {
      TestRenderer.create(React.createElement(Harness, { value: 'hello' }));
    });
    expect(ref.current.debouncedValue).toBe('hello');
  });

  it('does not update the debounced value before the delay elapses', () => {
    const { Harness, ref } = createHarness();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(React.createElement(Harness, { value: 'a' }));
    });

    act(() => {
      renderer.update(React.createElement(Harness, { value: 'ab' }));
    });

    // Advance less than the default delay
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(ref.current.debouncedValue).toBe('a');
  });

  it('updates to the final value after the delay elapses', () => {
    const { Harness, ref } = createHarness();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(React.createElement(Harness, { value: 'a' }));
    });

    act(() => {
      renderer.update(React.createElement(Harness, { value: 'ab' }));
    });
    act(() => {
      renderer.update(React.createElement(Harness, { value: 'abc' }));
    });

    act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_DELAY);
    });

    expect(ref.current.debouncedValue).toBe('abc');
  });
});

// ---------------------------------------------------------------------------
// Property 9: Debounce suppresses intermediate calls
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 9: Debounce suppresses intermediate calls', () => {
  it('for any sequence of N values within the debounce window, only the final value is emitted after the delay', async () => {
    await fc.assert(
      fc.property(
        // Generate a non-empty array of search terms (1..20 intermediate values)
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 2, maxLength: 20 }),
        (searchTerms) => {
          const { Harness, ref } = createHarness();
          const finalValue = searchTerms[searchTerms.length - 1];

          let renderer!: TestRenderer.ReactTestRenderer;

          // Render with the first value
          act(() => {
            renderer = TestRenderer.create(
              React.createElement(Harness, { value: searchTerms[0] }),
            );
          });

          // Rapidly update with all subsequent values within the debounce window
          for (let i = 1; i < searchTerms.length; i++) {
            act(() => {
              renderer.update(
                React.createElement(Harness, { value: searchTerms[i] }),
              );
            });
            // Advance a small amount of time (less than the debounce delay)
            // to simulate rapid keystrokes
            act(() => {
              jest.advanceTimersByTime(50);
            });
          }

          // Before the full debounce delay elapses from the last update,
          // the debounced value should still be the initial value
          const valueBeforeDelay = ref.current.debouncedValue;
          expect(valueBeforeDelay).toBe(searchTerms[0]);

          // Now advance past the debounce delay from the last update
          act(() => {
            jest.advanceTimersByTime(DEFAULT_DEBOUNCE_DELAY);
          });

          // After the delay, exactly the final value should be emitted
          expect(ref.current.debouncedValue).toBe(finalValue);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('a single value change results in exactly one debounced update after the delay', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 100, max: 1000 }),
        (initialValue, newValue, delay) => {
          // Skip if values are the same (no change to observe)
          fc.pre(initialValue !== newValue);

          const { Harness, ref } = createHarness();
          let renderer!: TestRenderer.ReactTestRenderer;

          act(() => {
            renderer = TestRenderer.create(
              React.createElement(Harness, { value: initialValue, delay }),
            );
          });

          // Update to new value
          act(() => {
            renderer.update(
              React.createElement(Harness, { value: newValue, delay }),
            );
          });

          // Before delay: still the initial value
          act(() => {
            jest.advanceTimersByTime(delay - 1);
          });
          expect(ref.current.debouncedValue).toBe(initialValue);

          // After delay: updated to new value
          act(() => {
            jest.advanceTimersByTime(1);
          });
          expect(ref.current.debouncedValue).toBe(newValue);
        },
      ),
      { numRuns: 100 },
    );
  });
});
