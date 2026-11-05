import { stampMovementDates } from '../../../../src/services/movement/stampMovementDates';

const NOW = new Date('2026-11-05T15:00:00.000Z');
const clock = () => new Date(NOW);

describe('stampMovementDates', () => {
  it('always sets createdAt to the registration moment, ignoring stale values', () => {
    const log = { createdAt: new Date('2020-01-01T00:00:00Z') };
    stampMovementDates(log, clock);
    expect(log.createdAt).toEqual(NOW);
  });

  it('keeps the movement date chosen by the user', () => {
    const chosen = new Date('2026-11-01T12:00:00Z');
    const log = { movementDate: chosen } as {
      createdAt?: Date;
      movementDate?: Date;
    };
    stampMovementDates(log, clock);
    expect(log.movementDate).toEqual(chosen);
    expect(log.createdAt).toEqual(NOW);
  });

  it('defaults the movement date to the registration moment', () => {
    const log: { createdAt?: Date; movementDate?: Date } = {};
    const result = stampMovementDates(log, clock);
    expect(result).toBe(log);
    expect(log.movementDate).toEqual(NOW);
    expect(log.movementDate).toBe(log.createdAt);
  });

  it('replaces an invalid movement date (never persists NULL)', () => {
    const log = {
      movementDate: new Date('invalid'),
    } as { createdAt?: Date; movementDate?: Date };
    stampMovementDates(log, clock);
    expect(log.movementDate).toEqual(NOW);
  });

  it('calls the clock once so both dates are consistent', () => {
    const spy = jest.fn(clock);
    stampMovementDates({}, spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
