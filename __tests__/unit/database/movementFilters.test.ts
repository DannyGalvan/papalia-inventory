jest.mock('typeorm', () => ({
  Between: (a: unknown, b: unknown) => ({ type: 'between', value: [a, b] }),
  Raw: jest.fn(),
  Equal: jest.fn(),
}));

import {
  MOVEMENT_DATE_ORDER,
  movementDateBetween,
} from '../../../src/database/utils/movementFilters';

describe('movementDateBetween', () => {
  it('filters on the business date, not the registration date', () => {
    const from = new Date('2026-11-01T06:00:00Z');
    const to = new Date('2026-11-02T05:59:59.999Z');
    const where = movementDateBetween(from, to);
    expect(Object.keys(where)).toEqual(['movementDate']);
    expect(where.movementDate).toEqual({
      type: 'between',
      value: [from, to],
    });
  });

  it('orders by movement date then id, newest first', () => {
    expect(MOVEMENT_DATE_ORDER).toEqual({ movementDate: 'DESC', id: 'DESC' });
  });
});
