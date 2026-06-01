/**
 * useTheme — convenience hook for consuming the ThemeContext.
 *
 * Returns the active resolved theme along with the `isDark` flag and the
 * `toggleTheme` action. Must be used within a `ThemeProvider`.
 *
 * Requirements: 2.1, 2.3
 */

import { useContext } from 'react';
import { ThemeContext, ThemeContextValue } from '../context/ThemeContext';

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context || !context.theme) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }

  return context;
};

export default useTheme;
