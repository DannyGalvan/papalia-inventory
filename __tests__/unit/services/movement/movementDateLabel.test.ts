import {
  movementDateLabel,
  REGISTRATION_DATE_LABEL,
} from '../../../../src/services/movement/movementDateLabel';

describe('movementDateLabel', () => {
  it('labels inputs as receipt date and outputs as sale date', () => {
    expect(movementDateLabel(true)).toBe('Fecha de entrada');
    expect(movementDateLabel(false)).toBe('Fecha de venta');
  });

  it('exposes the registration date label', () => {
    expect(REGISTRATION_DATE_LABEL).toBe('Fecha de registro');
  });
});
