/**
 * Validation utilities for Input/Output log forms (LogForm).
 *
 * The {@link validateLogForm} predicate is a pure function: given a LogHeader
 * form state it returns an errors object. It is intentionally free of any
 * React / React Native dependencies so it can be unit- and property-tested in
 * isolation (see Property 7) and reused by the LogForm component.
 *
 * Business rule (Requirement 7.6): the Input/Output type selection defaults to
 * 0 ("no seleccionado" / "Seleccione una opción"). A form whose `type` equals
 * 0 must be rejected with a Spanish validation message, regardless of the
 * values present in any other field, and submission must be prevented.
 *
 * Requirements: 7.6, 4.8
 */

import { LogHeader } from '../database/models/LogHeader';

/** Value representing the unselected ("no seleccionado") type option. */
export const UNSELECTED_TYPE = 0;

/** Spanish validation messages surfaced by {@link validateLogForm}. */
export const LOG_FORM_MESSAGES = {
  comments: 'Los comentarios son requeridos',
  type: 'Debe seleccionar un tipo',
  details: 'Debes agregar al menos un producto',
} as const;

/** Shape of the errors object produced by {@link validateLogForm}. */
export interface LogFormErrors {
  comments?: string;
  type?: string;
  details?: string;
}

/**
 * Validate an Input/Output log form.
 *
 * Returns an object keyed by field name containing a Spanish error message for
 * each invalid field. An empty object means the form is valid and may be
 * submitted.
 *
 * The `type === 0` ("no seleccionado") rule is evaluated independently of every
 * other field, so an unselected type always yields a `type` error regardless of
 * the comments or product details supplied (Requirement 7.6 / Property 7).
 *
 * @param form The current LogForm state.
 * @returns A {@link LogFormErrors} object (empty when the form is valid).
 */
export const validateLogForm = (form: LogHeader): LogFormErrors => {
  const errors: LogFormErrors = {};

  if (!form.comments) {
    errors.comments = LOG_FORM_MESSAGES.comments;
  }

  if (form.type === UNSELECTED_TYPE) {
    errors.type = LOG_FORM_MESSAGES.type;
  }

  if (!form.logDetails || form.logDetails.length === 0) {
    errors.details = LOG_FORM_MESSAGES.details;
  }

  return errors;
};
