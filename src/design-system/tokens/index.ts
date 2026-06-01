/**
 * Single entry point for the design system tokens.
 *
 * Consuming components import all design tokens (and their types) from this
 * module so that tokens are accessed from one place:
 *
 *   import {spacing, colorPalette, typography} from 'src/design-system/tokens';
 *
 * Requirements: 1.1, 1.2, 1.4, 1.5
 */

export { colorPalette, semanticColors } from './colors';
export type { ColorPalette, SemanticColors } from './colors';

export { typography } from './typography';
export type { FontWeight, TypographyLevel, TypographyScale } from './typography';

export { spacing } from './spacing';
export type { SpacingScale } from './spacing';

export { elevation } from './elevation';
export type { ElevationLevel, ElevationScale } from './elevation';

export { borderRadius } from './borders';
export type { BorderRadiusScale } from './borders';

