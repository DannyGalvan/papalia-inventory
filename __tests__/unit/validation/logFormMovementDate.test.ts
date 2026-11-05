import type { LogHeader } from '../../../src/database/models/LogHeader';
import { MOVEMENT_DATE_MESSAGES } from '../../../src/services/movement/movementDate';
import { validateLogForm } from '../../../src/utils/validateLogForm';

const NOW = new Date('2026-11-05T15:00:00.000Z');

const form = (movementDate?: unknown): LogHeader =>
  ({
    id: 0,
    type: 1,
    comments: 'Venta',
    isInput: false,
    movementDate,
    logDetails: [{ id: 1, name: 'Café', quantity: 1, price: 10 }],
  } as unknown as LogHeader);

describe('validateLogForm — movement date', () => {
  it('is valid when the date was not touched (defaults on save)', () => {
    expect(validateLogForm(form(undefined), NOW)).toEqual({});
  });

  it('accepts a past sale date', () => {
    expect(
      validateLogForm(form(new Date('2026-11-01T12:00:00Z')), NOW),
    ).toEqual({});
  });

  it('rejects a future sale date', () => {
    expect(
      validateLogForm(form(new Date('2026-11-06T12:00:00Z')), NOW).movementDate,
    ).toBe(MOVEMENT_DATE_MESSAGES.future);
  });

  it('rejects an invalid date', () => {
    expect(validateLogForm(form(new Date('bad')), NOW).movementDate).toBe(
      MOVEMENT_DATE_MESSAGES.invalid,
    );
  });

  it('defaults "now" to the current time', () => {
    const farFuture = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(validateLogForm(form(farFuture)).movementDate).toBe(
      MOVEMENT_DATE_MESSAGES.future,
    );
  });
});
