/**
 * Theme type definitions for the "liquid" design system.
 *
 * A `Theme` is the fully-resolved set of design values handed to components
 * by the `ThemeProvider`. It combines the base color palette, the warehouse
 * semantic colors, and a small set of theme-level UI colors (text,
 * textSecondary, border, disabled) together with the typography, spacing,
 * elevation and border radius scales.
 *
 * Both the light theme (`./light.ts`) and the dark theme (`./dark.ts`)
 * implement this exact interface so consuming components can rely on every
 * token being present regardless of the active theme.
 *
 * Requirements: 2.1, 4.5
 */

import type {
    BorderRadiusScale,
    ColorPalette,
    ElevationScale,
    SemanticColors,
    SpacingScale,
    TypographyScale,
} from '../tokens';

/**
 * Theme-level UI colors that are resolved per theme (light/dark) and are not
 * part of the theme-agnostic base palette.
 */
export interface ThemeUIColors {
  /** Primary text color. Must meet WCAG 4.5:1 against background and surface. */
  text: string;
  /** Secondary / muted text color. Must meet WCAG 4.5:1 against background and surface. */
  textSecondary: string;
  /** Divider / outline color. Meets the WCAG 1.4.11 non-text 3:1 contrast. */
  border: string;
  /** Disabled control / text color. */
  disabled: string;
}

/**
 * The full set of colors available on a resolved theme: the base palette,
 * the warehouse semantic colors, and the theme-level UI colors.
 */
export type ThemeColors = ColorPalette & SemanticColors & ThemeUIColors;

/**
 * A fully resolved theme provided to components by the `ThemeProvider`.
 */
export interface Theme {
  /** All color values for the active theme. */
  colors: ThemeColors;
  /** Typography scale (shared across themes). */
  typography: TypographyScale;
  /** Spacing scale (shared across themes). */
  spacing: SpacingScale;
  /** Elevation scale (shared across themes). */
  elevation: ElevationScale;
  /** Border radius scale (shared across themes). */
  borderRadius: BorderRadiusScale;
}
