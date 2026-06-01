/**
 * Typography tokens for the "liquid" design system.
 *
 * Provides a typed typography scale of 5 levels (h1, h2, body, caption,
 * overline), each specifying fontSize, fontWeight and lineHeight so that
 * font sizing is consistent and platform-agnostic.
 *
 * Requirements: 1.1, 1.4, 1.5
 */

/** Allowed font weights across the design system. */
export type FontWeight = 'normal' | 'bold' | '500' | '600' | '700';

/** A single typography level. */
export interface TypographyLevel {
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
}

/** Typography scale with at least 5 levels. */
export interface TypographyScale {
  h1: TypographyLevel;
  h2: TypographyLevel;
  body: TypographyLevel;
  caption: TypographyLevel;
  overline: TypographyLevel;
}

/** Default typography scale. */
export const typography: TypographyScale = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: 'normal',
    lineHeight: 18,
  },
  overline: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
};
