import {
  CANCEL_REASON_MAX_LENGTH,
  CANCEL_REASON_MIN_LENGTH,
  normalizeCancelReason,
  validateCancelReason,
} from '../../../../src/services/movement/cancelReason';

describe('cancel reason', () => {
  it('normalizes whitespace', () => {
    expect(normalizeCancelReason('  error   de\n captura ')).toBe(
      'error de captura',
    );
  });

  it('rejects short or blank reasons', () => {
    expect(validateCancelReason('')).toMatch(/al menos/);
    expect(validateCancelReason('    ')).toMatch(/al menos/);
    expect(
      validateCancelReason('a'.repeat(CANCEL_REASON_MIN_LENGTH - 1)),
    ).toMatch(/al menos/);
  });

  it('rejects overly long reasons', () => {
    expect(
      validateCancelReason('a'.repeat(CANCEL_REASON_MAX_LENGTH + 1)),
    ).toMatch(/superar/);
  });

  it('accepts valid reasons', () => {
    expect(validateCancelReason('Cantidad errónea')).toBeNull();
    expect(
      validateCancelReason('a'.repeat(CANCEL_REASON_MAX_LENGTH)),
    ).toBeNull();
  });
});
