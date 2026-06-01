/**
 * Elevation tokens for the "liquid" design system.
 *
 * Provides 3 elevation levels (low, medium, high). Each level includes both
 * iOS shadow properties (shadowColor/Offset/Opacity/Radius) and the Android
 * `elevation` value so that consuming components get equivalent depth on both
 * platforms without platform-conditional overrides.
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

/** A single elevation level with cross-platform shadow properties. */
export interface ElevationLevel {
  shadowColor: string;
  shadowOffset: {width: number; height: number};
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/** Elevation scale with 3 levels. */
export interface ElevationScale {
  low: ElevationLevel;
  medium: ElevationLevel;
  high: ElevationLevel;
}

/** Default elevation scale. */
export const elevation: ElevationScale = {
  low: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 6,
  },
  high: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 12,
  },
};
