import { FindOperator } from 'typeorm';
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
