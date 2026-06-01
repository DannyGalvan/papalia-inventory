/**
 * Single entry point for the design system themes.
 *
 * Consuming code imports the resolved themes and the `Theme` type from this
 * module:
 *
 *   import {lightTheme, darkTheme, Theme} from 'src/design-system/themes';
 *
 * Requirements: 2.1, 4.5
 */

export type { Theme, ThemeColors, ThemeUIColors } from './types';

export { darkTheme } from './dark';
export { lightTheme } from './light';

