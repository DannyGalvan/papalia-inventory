/**
 * Light theme definition for the "liquid" design system.
 *
 * Implements the full `Theme` interface with light color values. Every text
 * color is chosen to meet the WCAG 2.1 minimum contrast ratio of 4.5:1 for
 * normal text against both the `background` and `surface` colors (and 3:1 for
 * large text). Semantic/foreground colors that may be rendered as text were
 * darkened from their base palette values so they remain readable on light
 * surfaces.
 *
 * Verified contrast ratios (foreground on background / on surface):
 *   text          #16191D  ->  17.63:1 / 15.68:1
 *   textSecondary #4B5563  ->   7.56:1 /  6.72:1
 *   primary       #03698A  ->   6.19:1 /  5.51:1
 *   secondary     #B5500A  ->   5.10:1 /  4.54:1
 *   error         #C62828  ->   5.62:1 /  5.00:1
 *   success       #2E7D32  ->   5.13:1 /  4.56:1
 *   warning       #8A5A00  ->   5.93:1 /  5.27:1
 *   disabled      #646E7A  ->   5.18:1 /  4.61:1
 *   border        #6E7680  ->   4.60:1 /  4.09:1 (non-text >= 3:1)
 *
 * Requirements: 2.1, 4.5
 */

import { borderRadius, elevation, spacing, typography } from '../tokens';
import type { Theme } from './types';

export const lightTheme: Theme = {
  colors: {
    // Base palette
    primary: '#03698A',
    secondary: '#B5500A',
    background: '#FFFFFF',
    surface: '#EEF2F7',
    error: '#C62828',
    success: '#2E7D32',
    warning: '#8A5A00',

    // Warehouse semantic colors
    stockAvailable: '#2E7D32',
    stockDepleted: '#C62828',
    entryMovement: '#03698A',
    exitMovement: '#B5500A',
    successFeedback: '#2E7D32',
    warningFeedback: '#8A5A00',
    errorFeedback: '#C62828',

    // Theme-level UI colors
    text: '#16191D',
    textSecondary: '#4B5563',
    border: '#6E7680',
    disabled: '#646E7A',
  },
  typography,
  spacing,
  elevation,
  borderRadius,
};

export default lightTheme;
