import { getErrorMessage } from '../../utils/getErrorMessage';
import { normalizeCancelReason, validateCancelReason } from './cancelReason';
import { describeStockViolations, planStockReversal } from './stockReversal';
import {
  CancelMovementFailure,
  CancelMovementRejection,
  CancelMovementResult,
  MovementCancellationStore,
  StockViolation,
} from './types';

/** Thrown inside the transaction to roll it back with a typed outcome. */
class CancellationAborted extends Error {
  constructor(readonly result: CancelMovementRejection) {
    super(result.message);
    this.name = 'CancellationAborted';
  }
}

const abort = (
  failure: CancelMovementFailure,
  message: string,
  violations?: StockViolation[],
): never => {
  throw new CancellationAborted({ ok: false, failure, message, violations });
};

/**
 * Voids an input/output movement: reverts its stock effect and flags it as
 * cancelled, atomically. Inputs whose reversal would leave negative stock are
 * rejected (part of that merchandise was already shipped).
 */
export class MovementCancellationService {
  constructor(
    private readonly store: MovementCancellationStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async cancel(id: number, reason: string): Promise<CancelMovementResult> {
    const reasonError = validateCancelReason(reason);
    if (reasonError) {
      return { ok: false, failure: 'invalid_reason', message: reasonError };
    }
    const cleanReason = normalizeCancelReason(reason);

    try {
      return await this.store.runInTransaction(async tx => {
        const movement = await tx.findMovement(id);
        if (!movement) {
          return abort('not_found', 'La operación no existe.');
        }
        if (movement.isCancelled) {
          return abort('already_cancelled', 'La operación ya fue cancelada.');
        }

        const stocks = await tx.getStocks(
          movement.lines.map(line => line.productCode),
        );
        const plan = planStockReversal(movement, stocks);

        if (plan.violations.length > 0) {
          return abort(
            'negative_stock',
            `No se puede cancelar: el stock quedaría negativo para ${describeStockViolations(
              plan.violations,
            )}.`,
            plan.violations,
          );
        }

        for (const adjustment of plan.adjustments) {
          await tx.adjustStock(adjustment);
        }
        const cancelledAt = this.now();
        await tx.markCancelled(id, cleanReason, cancelledAt);

        return {
          ok: true as const,
          cancelledAt,
          message: movement.isInput
            ? 'Entrada cancelada. El stock fue revertido.'
            : 'Salida cancelada. El stock fue devuelto al inventario.',
        };
      });
    } catch (error: unknown) {
      if (error instanceof CancellationAborted) {
        return error.result;
      }
      return {
        ok: false,
        failure: 'unknown',
        message: `No se pudo cancelar la operación: ${getErrorMessage(
          error,
          'error desconocido',
        )}`,
      };
    }
  }
}
