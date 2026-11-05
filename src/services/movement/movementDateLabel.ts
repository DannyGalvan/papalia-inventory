/** Label of the movement date field: receipt date for inputs, sale for outputs. */
export const movementDateLabel = (isInput: boolean): string =>
  isInput ? 'Fecha de entrada' : 'Fecha de venta';

/** Label of the system registration (creation) date. */
export const REGISTRATION_DATE_LABEL = 'Fecha de registro';
