/**
 * Property-based tests for the "liquid" design system theme layer.
 *
 * Feature: app-modernization
 *   Property 1: Theme completeness — both light and dark themes provide a
 *               non-empty, valid color string for every color token key.
 *   Property 2: Theme toggle involution — toggle(toggle(state)) === state.
 *   Property 4: Color contrast compliance — every text/background pair meets
 *               the WCAG 2.1 contrast minimums (4.5:1 normal, 3:1 large).
 *
 * Validates: Requirements 2.1, 2.3, 4.5
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 */

import fc from 'fast-check';
import { darkTheme, lightTheme, Theme } from '../../../src/design-system/themes';

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/** Matches `#RGB`, `#RRGGBB` and `#RRGGBBAA` color representations. */
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** All color token keys present on a resolved theme. */
const COLOR_KEYS = Object.keys(lightTheme.colors) as Array<
  keyof Theme['colors']
>;

/**
 * Foreground colors that are rendered as text and therefore must satisfy the
 * WCAG text-contrast minimums against the theme's background surfaces. The
 * `border` token is intentionally excluded because it is a non-text element
 * (held to the 3:1 WCAG 1.4.11 rule, not the 4.5:1 text rule).
 */
const TEXT_FOREGROUND_KEYS: Array<keyof Theme['colors']> = [
  'text',
  'textSecondary',
  'primary',
  'secondary',
  'error',
  'success',
  'warning',
  'disabled',
  'stockAvailable',
  'stockDepleted',
  'entryMovement',
  'exitMovement',
  'successFeedback',
  'warningFeedback',
  'errorFeedback',
];

/** Background surfaces that text is rendered on top of. */
const BACKGROUND_KEYS: Array<keyof Theme['colors']> = ['background', 'surface'];

/** Parse a 6/3-digit hex color into 8-bit RGB channels. */
function hexToRgb(hex: string): {r: number; g: number; b: number} {
  let value = hex.replace('#', '');
  if (value.length === 3) {
    value = value
      .split('')
      .map(c => c + c)
      .join('');
  }
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** Convert an 8-bit channel to its linearized sRGB value. */
function linearizeChannel(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.1 relative luminance of a hex color. */
function relativeLuminance(hex: string): number {
  const {r, g, b} = hexToRgb(hex);
  return (
    0.2126 * linearizeChannel(r) +
    0.7152 * linearizeChannel(g) +
    0.0722 * linearizeChannel(b)
  );
}

/** WCAG 2.1 contrast ratio between two hex colors (1:1 .. 21:1). */
function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const THEMES: Record<'light' | 'dark', Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

type ThemePreference = 'light' | 'dark';

/** Pure model of the ThemeProvider toggle: flips light <-> dark. */
const togglePreference = (p: ThemePreference): ThemePreference =>
  p === 'dark' ? 'light' : 'dark';

/** Resolve a preference to its concrete theme object (mirrors ThemeContext). */
const resolveTheme = (p: ThemePreference): Theme => THEMES[p];

// ---------------------------------------------------------------------------
// Helper-validation unit tests (anchor the WCAG math used by Property 4)
// ---------------------------------------------------------------------------

describe('WCAG contrast helper', () => {
  it('reports 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('reports 1:1 for identical colors', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });

  it('matches the documented light-theme text contrast (~17.63:1)', () => {
    // lightTheme.colors.text (#16191D) on background (#FFFFFF)
    expect(contrastRatio('#16191D', '#FFFFFF')).toBeCloseTo(17.63, 1);
  });
});

// ---------------------------------------------------------------------------
// Property 1: Theme completeness
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 1: Theme completeness — both themes provide a non-empty valid color for every token key', () => {
  it('every color token key resolves to a non-empty valid color string in both themes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'light' | 'dark'>('light', 'dark'),
        fc.constantFrom(...COLOR_KEYS),
        (themeName, colorKey) => {
          const value = THEMES[themeName].colors[colorKey];

          // Defined, string, and non-empty.
          expect(typeof value).toBe('string');
          expect(value.trim().length).toBeGreaterThan(0);

          // Valid CSS/RN color representation.
          expect(value).toMatch(HEX_COLOR);

          // Both themes must expose the very same set of keys.
          expect(Object.prototype.hasOwnProperty.call(lightTheme.colors, colorKey)).toBe(true);
          expect(Object.prototype.hasOwnProperty.call(darkTheme.colors, colorKey)).toBe(true);
        },
      ),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Theme toggle involution
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 2: Theme toggle involution — toggle(toggle(state)) === state', () => {
  it('toggling twice returns to the original preference and resolved theme', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ThemePreference>('light', 'dark'),
        start => {
          const once = togglePreference(start);
          const twice = togglePreference(once);

          // A single toggle must switch to the alternate theme (Req 2.3).
          expect(once).not.toBe(start);
          expect(resolveTheme(once)).not.toBe(resolveTheme(start));

          // Toggling twice is the identity (involution).
          expect(twice).toBe(start);
          expect(resolveTheme(twice)).toBe(resolveTheme(start));
        },
      ),
      {numRuns: 100},
    );
  });

  it('any even number of toggles is the identity and any odd number is the alternate', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ThemePreference>('light', 'dark'),
        fc.integer({min: 0, max: 100}),
        (start, count) => {
          let state = start;
          for (let i = 0; i < count; i++) {
            state = togglePreference(state);
          }
          const expected = count % 2 === 0 ? start : togglePreference(start);
          expect(state).toBe(expected);
        },
      ),
      {numRuns: 100},
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Color contrast compliance
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 4: Color contrast compliance — text/background pairs meet WCAG 4.5:1 (normal) and 3:1 (large)', () => {
  it('every text/background pair meets the WCAG minimum for the given font size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'light' | 'dark'>('light', 'dark'),
        fc.constantFrom(...TEXT_FOREGROUND_KEYS),
        fc.constantFrom(...BACKGROUND_KEYS),
        fc.integer({min: 8, max: 48}),
        (themeName, fgKey, bgKey, fontSize) => {
          const theme = THEMES[themeName];
          const foreground = theme.colors[fgKey];
          const background = theme.colors[bgKey];

          const ratio = contrastRatio(foreground, background);
          // Normal text (< 18) requires 4.5:1; large text (>= 18) requires 3:1.
          const required = fontSize < 18 ? 4.5 : 3.0;

          expect(ratio).toBeGreaterThanOrEqual(required);
        },
      ),
      {numRuns: 100},
    );
  });
});
