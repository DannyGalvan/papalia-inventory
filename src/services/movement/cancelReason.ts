export const CANCEL_REASON_MIN_LENGTH = 5;
export const CANCEL_REASON_MAX_LENGTH = 250;

/** Collapse whitespace and trim the user-entered reason. */
export const normalizeCancelReason = (reason: string): string =>
  (reason ?? '').replace(/\s+/g, ' ').trim();

/** Spanish validation error for `reason`, or `null` when it is valid. */
export const validateCancelReason = (reason: string): string | null => {
  const normalized = normalizeCancelReason(reason);
  if (normalized.length < CANCEL_REASON_MIN_LENGTH) {
    return `El motivo debe tener al menos ${CANCEL_REASON_MIN_LENGTH} caracteres.`;
  }
  if (normalized.length > CANCEL_REASON_MAX_LENGTH) {
    return `El motivo no puede superar ${CANCEL_REASON_MAX_LENGTH} caracteres.`;
  }
  return null;
};
