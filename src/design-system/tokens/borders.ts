/**
 * Border radius tokens for the "liquid" design system.
 *
 * Provides 3 border radius levels (sm, md, lg) used to apply consistent
 * rounded corners across card-style components.
 *
 * Requirements: 1.1, 1.4, 1.5
 */

/** Border radius scale with 3 levels. */
export interface BorderRadiusScale {
  sm: number; // 4
  md: number; // 8
  lg: number; // 16
}

/** Default border radius scale. */
export const borderRadius: BorderRadiusScale = {
  sm: 4,
  md: 8,
  lg: 16,
};
