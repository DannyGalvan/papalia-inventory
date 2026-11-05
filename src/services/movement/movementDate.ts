import { toDate } from '../../utils/toDate';

/** Spanish validation messages for the movement (sale/receipt) date. */
export const MOVEMENT_DATE_MESSAGES = {
  invalid: 'La fecha del movimiento no es válida',
  future: 'La fecha no puede ser posterior a la fecha actual',
} as const;

/**
 * Grace period accepted beyond "now" to absorb clock drift between the
 * picker and the validation moment.
 */
export const FUTURE_TOLERANCE_MS = 60 * 1000;

/**
 * Validate a user-chosen movement date. Returns an error message, or
 * `undefined` when the date is acceptable (any past date up to now).
 */
export const validateMovementDate = (
  value: unknown,
  now: Date,
): string | undefined => {
  const date = toDate(value);
  if (!date) {
    return MOVEMENT_DATE_MESSAGES.invalid;
  }
  if (date.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    return MOVEMENT_DATE_MESSAGES.future;
  }
  return undefined;
};

/** Minimal shape needed to resolve the business date of a movement. */
export interface MovementDates {
  movementDate?: unknown;
  createdAt?: unknown;
}

/**
 * Business date of a movement: `movementDate` when valid, otherwise the
 * registration date (legacy rows / nitro-sqlite null markers).
 */
export const effectiveMovementDate = (header: MovementDates): Date | null =>
  toDate(header.movementDate) ?? toDate(header.createdAt);
