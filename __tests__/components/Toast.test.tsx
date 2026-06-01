/**
 * Unit tests for the Toast feedback component.
 *
 * Covers:
 *  - Renders the message and accessibility attributes when visible.
 *  - Renders nothing when not visible.
 *  - Auto-dismisses after the configured duration (Requirement 8.5).
 *  - Uses the active theme's feedback colors (Requirement 8.5, 8.8).
 *
 * Uses react-test-renderer (the project's configured renderer). `useTheme` is
 * mocked directly so the component test stays isolated from the
 * ThemeProvider's database-backed persistence (react-native-nitro-sqlite).
 */

import React from 'react';
import { Text, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { lightTheme } from '../../src/design-system/themes';

jest.mock('../../src/hooks/useTheme', () => {
  const { lightTheme: theme } = require('../../src/design-system/themes');
  const value = { theme, isDark: false, toggleTheme: jest.fn() };
  return {
    __esModule: true,
    useTheme: () => value,
    default: () => value,
  };
});

// Provide deterministic safe-area insets without a SafeAreaProvider.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 0, left: 0, right: 0 }),
}));

// Imported after the mocks above so the component picks up the mocked hook.
import { Toast } from '../../src/components/feedback/Toast';

const renderToast = (ui: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(ui);
  });
  return renderer;
};

const findAlert = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'alert')[0];

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the message when visible', () => {
    const renderer = renderToast(
      <Toast
        message="Producto guardado"
        type="success"
        visible
        onDismiss={jest.fn()}
      />,
    );

    const texts = renderer.root.findAllByType(Text);
    expect(texts.length).toBeGreaterThan(0);
    expect(texts[0].props.children).toBe('Producto guardado');
  });

  it('exposes alert accessibility attributes when visible', () => {
    const renderer = renderToast(
      <Toast
        message="Ocurrió un error"
        type="error"
        visible
        onDismiss={jest.fn()}
      />,
    );

    const alert = findAlert(renderer);
    expect(alert).toBeDefined();
    expect(alert.props.accessibilityLiveRegion).toBe('polite');
    expect(alert.props.accessibilityLabel).toBe('Error: Ocurrió un error');
  });

  it('renders nothing when not visible', () => {
    const renderer = renderToast(
      <Toast
        message="Invisible"
        type="warning"
        visible={false}
        onDismiss={jest.fn()}
      />,
    );

    expect(renderer.root.findAllByType(View).length).toBe(0);
  });

  it('auto-dismisses after the default 3000ms duration', () => {
    const onDismiss = jest.fn();
    renderToast(
      <Toast
        message="Producto guardado"
        type="success"
        visible
        onDismiss={onDismiss}
      />,
    );

    expect(onDismiss).not.toHaveBeenCalled();

    // Advance past the 3000ms auto-dismiss timer, then flush the exit animation.
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(3000);
    });
    ReactTestRenderer.act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('respects a custom duration', () => {
    const onDismiss = jest.fn();
    renderToast(
      <Toast
        message="Mensaje corto"
        type="success"
        visible
        duration={1000}
        onDismiss={onDismiss}
      />,
    );

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1);
    });
    ReactTestRenderer.act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('uses the success feedback color from the active theme', () => {
    const renderer = renderToast(
      <Toast message="Éxito" type="success" visible onDismiss={jest.fn()} />,
    );

    const alert = findAlert(renderer);
    const flattened = Array.isArray(alert.props.style)
      ? Object.assign({}, ...alert.props.style.flat(Infinity))
      : alert.props.style;

    expect(flattened.backgroundColor).toBe(lightTheme.colors.successFeedback);
  });
});
