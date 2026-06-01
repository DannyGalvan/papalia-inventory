/**
 * ErrorBoundary — top-level boundary that catches unhandled JavaScript errors
 * thrown anywhere in its child tree and renders a recovery screen instead of
 * letting the whole app crash.
 *
 * Behavior:
 *  - `getDerivedStateFromError` flips the boundary into its error state so the
 *    next render shows the recovery UI.
 *  - `componentDidCatch` records the error through the centralized
 *    {@link logService} (errorType, source, operation, message) so it can be
 *    inspected during the session (Requirement 10.5).
 *  - The recovery screen shows a Spanish error description and a "Reintentar"
 *    button that resets the boundary state, re-attempting to render the
 *    children (Requirement 10.1).
 *  - An optional `fallback` node may be supplied to fully replace the default
 *    recovery screen.
 *
 * React error boundaries MUST be class components — only class components can
 * implement `getDerivedStateFromError`/`componentDidCatch`. Because this
 * boundary wraps the `ThemeProvider` (it is the outermost component in the
 * app tree), it cannot consume the theme via `useTheme()`; it therefore uses
 * a small, self-contained neutral palette so it renders correctly even when
 * the theme system itself has failed.
 *
 * Requirements: 10.1, 10.5
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { logService } from '../../services/LogService';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** Spanish copy shown on the recovery screen. */
const RECOVERY_TITLE = 'Algo salió mal';
const RECOVERY_DESCRIPTION =
  'Ocurrió un error inesperado en la aplicación. Por favor, reinicia para continuar.';
const RECOVERY_BUTTON_LABEL = 'Reintentar';

/**
 * Self-contained neutral colors. The boundary sits above the ThemeProvider, so
 * it cannot rely on the active theme being available.
 */
const COLORS = {
  background: '#FFFFFF',
  surface: '#EEF2F7',
  text: '#16191D',
  textSecondary: '#4B5563',
  primary: '#03698A',
  onPrimary: '#FFFFFF',
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  /**
   * Render-phase hook: derive the error state so the recovery UI is shown on
   * the next render.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error};
  }

  /**
   * Commit-phase hook: log the caught error through the centralized
   * {@link logService} (Requirement 10.5).
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logService.logError({
      errorType: error.name || 'Error',
      source: 'ErrorBoundary',
      operation: 'render',
      message: error.message || String(error),
    });

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  /**
   * Reset the boundary so it re-attempts rendering its children
   * (Requirement 10.1).
   */
  private handleRestart = (): void => {
    this.setState({hasError: false, error: null});
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // A custom fallback fully replaces the default recovery screen.
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <View
        style={styles.container}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`${RECOVERY_TITLE}. ${RECOVERY_DESCRIPTION}`}>
        <Text
          accessibilityRole="header"
          style={styles.title}>
          {RECOVERY_TITLE}
        </Text>
        <Text style={styles.description}>{RECOVERY_DESCRIPTION}</Text>
        <TouchableOpacity
          onPress={this.handleRestart}
          accessibilityRole="button"
          accessibilityLabel={RECOVERY_BUTTON_LABEL}
          style={styles.button}>
          <Text style={styles.buttonText}>{RECOVERY_BUTTON_LABEL}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onPrimary,
  },
});

export default ErrorBoundary;
