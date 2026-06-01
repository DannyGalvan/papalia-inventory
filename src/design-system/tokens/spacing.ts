/**
 * Spacing tokens for the "liquid" design system.
 *
 * A spacing scale of 6 levels based on a consistent 4px base unit so that
 * margins and padding stay consistent across screens and platforms.
 *
 * Requirements: 1.1, 1.4, 1.5
 */

/** Spacing scale based on a 4px base unit. */
export interface SpacingScale {
  xs: number; // 4
  sm: number; // 8
  md: number; // 16
  lg: number; // 24
  xl: number; // 32
  xxl: number; // 48
}

/** Default spacing scale. */
export const spacing: SpacingScale = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
