/**
 * Property-based tests for the ErrorBoundary feedback component.
 *
 * Feature: app-modernization
 *   Property 11: Error boundary catches and renders recovery UI — for any
 *                JavaScript Error thrown by a child component within the
 *                ErrorBoundary, the boundary must catch the error and render a
 *                recovery screen containing a Spanish error description and a
 *                restart button, without propagating the error further.
 *
 * Validates: Requirements 10.1
 *
 * The property runs a minimum of 100 iterations via fast-check.
 *
 * React error boundaries log the caught error to `console.error` during the
 * render phase (this is React's own diagnostic output, and the boundary also
 * mirrors the error through `logService` in __DEV__). Both are expected here,
 * so `console.error` is spied/silenced to keep the test output clean while
 * still allowing the boundary to do its job.
 *
 * Uses react-test-renderer (the project's configured renderer), mirroring the
 * pattern in Toast.test.tsx and EmptyState.test.tsx.
 */

import fc from 'fast-check';
import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ErrorBoundary } from '../../src/components/feedback/ErrorBoundary';

// ---------------------------------------------------------------------------
// Spanish recovery-screen copy rendered by the boundary's default fallback.
// Kept in sync with src/components/feedback/ErrorBoundary.tsx.
// ---------------------------------------------------------------------------
const RECOVERY_DESCRIPTION =
  'Ocurrió un error inesperado en la aplicación. Por favor, reinicia para continuar.';
const RECOVERY_BUTTON_LABEL = 'Reintentar';

/**
 * A child component that always throws the supplied error message during
 * render, simulating an unhandled JavaScript error in the child tree.
 */
const Bomb: React.FC<{message: string}> = ({message}) => {
  throw new Error(message);
};

/** Render an element with act(), returning the renderer (or throwing). */
const render = (ui: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(ui);
  });
  return renderer;
};

/** Collect every string rendered inside a <Text> node in the tree. */
const collectTextStrings = (
  renderer: ReactTestRenderer.ReactTestRenderer,
): string[] =>
  renderer.root
    .findAllByType(Text)
    .flatMap(node => {
      const {children} = node.props;
      return Array.isArray(children) ? children : [children];
    })
    .filter((child): child is string => typeof child === 'string');

describe('Feature: app-modernization, Property 11: Error boundary catches and renders recovery UI', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Silence React's render-phase error logging and the boundary's own
    // __DEV__ console.error mirror — both are expected for caught errors.
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('catches any child Error and renders the Spanish recovery UI with a restart button', () => {
    fc.assert(
      fc.property(fc.string(), message => {
        let renderer!: ReactTestRenderer.ReactTestRenderer;

        // The boundary must NOT propagate the error: rendering a throwing
        // child inside it must not throw.
        expect(() => {
          renderer = render(
            <ErrorBoundary>
              <Bomb message={message} />
            </ErrorBoundary>,
          );
        }).not.toThrow();

        // The recovery screen must expose a restart button (accessibilityRole
        // "button") labelled "Reintentar".
        const buttons = renderer.root.findAll(
          node => node.props.accessibilityRole === 'button',
        );
        expect(buttons.length).toBeGreaterThan(0);
        expect(
          buttons.some(b => b.props.accessibilityLabel === RECOVERY_BUTTON_LABEL),
        ).toBe(true);

        // The recovery screen must show the Spanish error description and the
        // button label text.
        const texts = collectTextStrings(renderer);
        expect(texts).toContain(RECOVERY_DESCRIPTION);
        expect(texts).toContain(RECOVERY_BUTTON_LABEL);

        // Tidy up so each iteration starts from a clean tree.
        ReactTestRenderer.act(() => {
          renderer.unmount();
        });
      }),
      {numRuns: 100},
    );
  });

  it('exposes an alert role on the recovery screen for any thrown error', () => {
    fc.assert(
      fc.property(fc.string(), message => {
        const renderer = render(
          <ErrorBoundary>
            <Bomb message={message} />
          </ErrorBoundary>,
        );

        const alerts = renderer.root.findAll(
          node => node.props.accessibilityRole === 'alert',
        );
        expect(alerts.length).toBeGreaterThan(0);

        ReactTestRenderer.act(() => {
          renderer.unmount();
        });
      }),
      {numRuns: 100},
    );
  });
});
