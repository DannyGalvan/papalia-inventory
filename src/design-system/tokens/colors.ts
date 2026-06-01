/**
 * Color tokens for the "liquid" design system.
 *
 * `ColorPalette` defines the base brand/UI colors and `SemanticColors`
 * defines warehouse (bodega) domain-specific colors used to communicate
 * inventory and movement states.
 *
 * These default values are theme-agnostic base references. The light and
 * dark themes (see `src/design-system/themes/`) provide the per-theme
 * overrides where contrast adjustments are required.
 *
 * Requirements: 1.1, 1.2, 1.4, 1.5
 */

/**
 * Base color palette. At minimum provides primary, secondary, background,
 * surface and error; success and warning are also included for feedback.
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
}

/**
 * Semantic color tokens mapped to warehouse domain concepts.
 */
export interface SemanticColors {
  /** Product has available inventory. */
  stockAvailable: string;
  /** Product has zero / depleted inventory. */
  stockDepleted: string;
  /** Inventory entry (input) movement. */
  entryMovement: string;
  /** Inventory exit (output) movement. */
  exitMovement: string;
  /** Successful operation feedback. */
  successFeedback: string;
  /** Warning feedback. */
  warningFeedback: string;
  /** Error feedback. */
  errorFeedback: string;
}

/**
 * Default base palette aligned with the existing brand colors
 * (see `src/styles/globalStyles.ts`).
 */
export const colorPalette: ColorPalette = {
  primary: '#0688B1',
  secondary: '#DF680B',
  background: '#FFFFFF',
  surface: '#F5F7FA',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57F17',
};

/**
 * Default semantic colors for the warehouse domain.
 */
export const semanticColors: SemanticColors = {
  stockAvailable: '#388E3C',
  stockDepleted: '#D32F2F',
  entryMovement: '#0688B1',
  exitMovement: '#DF680B',
  successFeedback: '#388E3C',
  warningFeedback: '#F57F17',
  errorFeedback: '#D32F2F',
};
