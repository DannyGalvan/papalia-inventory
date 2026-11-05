import { Between, FindOperator } from 'typeorm';
import { sqliteBoolean } from './sqliteBoolean';

/**
 * WHERE fragment that keeps only non-cancelled movements. Cancelled
 * movements stay visible in history lists but must never count towards
 * dashboards, reports or profit.
 */
export const activeMovementsWhere = (): {
  isCancelled: FindOperator<boolean>;
} => ({
  isCancelled: sqliteBoolean(false),
});

/**
 * WHERE fragment for movements whose business date (sale/receipt date) falls
 * within [from, to]. Single place deciding which date drives date filters.
 */
export const movementDateBetween = (
  from: Date,
  to: Date,
): { movementDate: FindOperator<Date> } => ({
  movementDate: Between(from, to),
});

/** Newest business date first; id breaks ties deterministically. */
export const MOVEMENT_DATE_ORDER = {
  movementDate: 'DESC',
  id: 'DESC',
} as const;
