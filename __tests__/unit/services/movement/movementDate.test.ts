import {
  effectiveMovementDate,
  FUTURE_TOLERANCE_MS,
  MOVEMENT_DATE_MESSAGES,
  validateMovementDate,
} from '../../../../src/services/movement/movementDate';

const NOW = new Date('2026-11-05T15:00:00.000Z');

describe('validateMovementDate', () => {
  it('accepts past dates and now', () => {
    expect(
      validateMovementDate(new Date('2026-10-01T00:00:00Z'), NOW),
    ).toBeUndefined();
    expect(validateMovementDate(new Date(NOW), NOW)).toBeUndefined();
  });

  it('tolerates small clock drift', () => {
    const drift = new Date(NOW.getTime() + FUTURE_TOLERANCE_MS);
    expect(validateMovementDate(drift, NOW)).toBeUndefined();
  });

  it('rejects future dates beyond the tolerance', () => {
    const future = new Date(NOW.getTime() + FUTURE_TOLERANCE_MS + 1);
    expect(validateMovementDate(future, NOW)).toBe(
      MOVEMENT_DATE_MESSAGES.future,
    );
    expect(validateMovementDate(new Date('2026-11-06T00:00:00Z'), NOW)).toBe(
      MOVEMENT_DATE_MESSAGES.future,
    );
  });

  it('rejects invalid values', () => {
    for (const value of [
      new Date('nope'),
      'not a date',
      { isNitroSQLiteNull: true },
      undefined,
      null,
    ]) {
      expect(validateMovementDate(value, NOW)).toBe(
        MOVEMENT_DATE_MESSAGES.invalid,
      );
    }
  });
});

describe('effectiveMovementDate', () => {
  const createdAt = new Date('2026-11-05T10:00:00Z');

  it('prefers the movement date', () => {
    const movementDate = new Date('2026-11-01T10:00:00Z');
    expect(effectiveMovementDate({ movementDate, createdAt })).toEqual(
      movementDate,
    );
  });

  it('parses string dates coming from the database', () => {
    expect(
      effectiveMovementDate({
        movementDate: '2026-11-01T10:00:00.000Z',
        createdAt,
      }),
    ).toEqual(new Date('2026-11-01T10:00:00.000Z'));
  });

  it('falls back to createdAt for legacy / null-marker rows', () => {
    expect(effectiveMovementDate({ createdAt })).toEqual(createdAt);
    expect(
      effectiveMovementDate({
        movementDate: { isNitroSQLiteNull: true },
        createdAt,
      }),
    ).toEqual(createdAt);
    expect(
      effectiveMovementDate({ movementDate: new Date('x'), createdAt }),
    ).toEqual(createdAt);
  });

  it('returns null when no date is usable', () => {
    expect(effectiveMovementDate({})).toBeNull();
  });
});
