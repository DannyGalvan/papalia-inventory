/** Contracts for cancelling (voiding) inventory movements. */

export interface MovementLine {
  productCode: string;
  name: string;
  quantity: number;
}

/** Minimal movement data needed to cancel it. */
export interface MovementSnapshot {
  id: number;
  isInput: boolean;
  isCancelled: boolean;
  lines: MovementLine[];
}

/** Stock delta to apply to one product when reverting a movement. */
export interface StockAdjustment {
  productCode: string;
  delta: number;
}

/** A product whose stock would go negative if the movement were reverted. */
export interface StockViolation {
  productCode: string;
  name: string;
  currentStock: number;
  resultingStock: number;
}

/** Operations available inside a single cancellation transaction. */
export interface MovementCancellationTx {
  findMovement(id: number): Promise<MovementSnapshot | null>;
  /** Current stock by product code (missing products are omitted). */
  getStocks(codes: string[]): Promise<Map<string, number>>;
  adjustStock(adjustment: StockAdjustment): Promise<void>;
  markCancelled(id: number, reason: string, at: Date): Promise<void>;
}

/** Persistence port: runs `work` atomically (all or nothing). */
export interface MovementCancellationStore {
  runInTransaction<T>(
    work: (tx: MovementCancellationTx) => Promise<T>,
  ): Promise<T>;
}

export type CancelMovementFailure =
  | 'invalid_reason'
  | 'not_found'
  | 'already_cancelled'
  | 'negative_stock'
  | 'unknown';

export type CancelMovementResult =
  | { ok: true; cancelledAt: Date; message: string }
  | {
      ok: false;
      failure: CancelMovementFailure;
      message: string;
      violations?: StockViolation[];
    };

export type CancelMovementRejection = Exclude<
  CancelMovementResult,
  { ok: true }
>;

/** Type guard (works without `strictNullChecks` narrowing). */
export const isCancelRejection = (
  result: CancelMovementResult,
): result is CancelMovementRejection => result.ok === false;
