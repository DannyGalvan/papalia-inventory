import { toDate } from '../../utils/toDate';

/** Source of the current time; injected so persistence is testable. */
export type Clock = () => Date;

interface Stampable {
  createdAt?: Date;
  movementDate?: Date;
}

/**
 * Assign the dates of a movement right before persisting it:
 *  - `createdAt` is always the registration moment (`clock()`); any value
 *    coming from the form is ignored, so it can never be stale.
 *  - `movementDate` keeps the user's choice when valid, otherwise defaults
 *    to the registration moment. It is never left NULL (nitro-sqlite).
 */
export const stampMovementDates = <T extends Stampable>(
  log: T,
  clock: Clock,
): T => {
  const createdAt = clock();
  log.createdAt = createdAt;
  log.movementDate = toDate(log.movementDate) ?? createdAt;
  return log;
};
