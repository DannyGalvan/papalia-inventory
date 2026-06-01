/**
 * Dark theme definition for the "liquid" design system.
 *
 * Implements the full `Theme` interface with dark color values. Every text
 * color is chosen to meet the WCAG 2.1 minimum contrast ratio of 4.5:1 for
 * normal text against both the `background` and `surface` colors (and 3:1 for
 * large text). Semantic/foreground colors that may be rendered as text were
 * lightened from their base palette values so they remain readable on dark
 * surfaces.
 *
 * Verified contrast ratios (foreground on background / on surface):
 *   text          #ECEFF3  ->  16.00:1 / 13.85:1
 *   textSecondary #AEB6C2  ->   9.02:1 /  7.81:1
 *   primary       #4FC3E8  ->   9.05:1 /  7.84:1
 *   secondary     #F9A66C  ->   9.40:1 /  8.14:1
 *   error         #EF6B6B  ->   6.14:1 /  5.31:1
 *   success       #7BC67E  ->   8.98:1 /  7.77:1
 *   warning       #E0B341  ->   9.40:1 /  8.13:1
 *   disabled      #929CAA  ->   6.64:1 /  5.75:1
 *   border        #646E7A  ->   3.56:1 /  3.08:1 (non-text >= 3:1)
 *
 * Requirements: 2.1, 4.5
 */

import { borderRadius, elevation, spacing, typography } from '../tokens';
import type { Theme } from './types';

export const darkTheme: Theme = {
  colors: {
    // Base palette
    primary: '#4FC3E8',
    secondary: '#F9A66C',
    background: '#121417',
    surface: '#1E2228',
    error: '#EF6B6B',
    success: '#7BC67E',
    warning: '#E0B341',

    // Warehouse semantic colors
    stockAvailable: '#7BC67E',
    stockDepleted: '#EF6B6B',
    entryMovement: '#4FC3E8',
    exitMovement: '#F9A66C',
    successFeedback: '#7BC67E',
    warningFeedback: '#E0B341',
    errorFeedback: '#EF6B6B',

    // Theme-level UI colors
    text: '#ECEFF3',
    textSecondary: '#AEB6C2',
    border: '#646E7A',
    disabled: '#929CAA',
  },
  typography,
  spacing,
  elevation,
  borderRadius,
};

export default darkTheme;
