import { MovementSnapshot, StockAdjustment, StockViolation } from './types';

export interface StockReversalPlan {
  adjustments: StockAdjustment[];
  violations: StockViolation[];
}

/**
 * Plan the stock changes that undo `movement`.
 *  - Input  → stock decreases by the received quantity.
 *  - Output → stock increases by the shipped quantity.
 * Lines for the same product are aggregated; products that no longer exist
 * are skipped (there is no stock left to restore). Any product that would end
 * below zero is reported as a violation.
 *
 * Pure function: no I/O, safe to unit/property test.
 */
export const planStockReversal = (
  movement: Pick<MovementSnapshot, 'isInput' | 'lines'>,
  currentStock: ReadonlyMap<string, number>,
): StockReversalPlan => {
  const totals = new Map<string, { name: string; quantity: number }>();
  for (const line of movement.lines) {
    const quantity = Number(line.quantity) || 0;
    const entry = totals.get(line.productCode);
    if (entry) {
      entry.quantity += quantity;
    } else {
      totals.set(line.productCode, { name: line.name, quantity });
    }
  }

  const sign = movement.isInput ? -1 : 1;
  const adjustments: StockAdjustment[] = [];
  const violations: StockViolation[] = [];

  totals.forEach(({ name, quantity }, productCode) => {
    const stock = currentStock.get(productCode);
    if (stock === undefined || quantity === 0) {
      return;
    }
    const delta = sign * quantity;
    const resultingStock = stock + delta;
    if (resultingStock < 0) {
      violations.push({
        productCode,
        name,
        currentStock: stock,
        resultingStock,
      });
    }
    adjustments.push({ productCode, delta });
  });

  return { adjustments, violations };
};

/** Spanish summary of the products that block a cancellation. */
export const describeStockViolations = (violations: StockViolation[]): string =>
  violations
    .map(
      v =>
        `${v.name} (stock actual ${v.currentStock}, quedaría en ${v.resultingStock})`,
    )
    .join(', ');
