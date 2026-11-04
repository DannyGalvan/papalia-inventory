import { useCallback, useRef, useState } from 'react';
import { logService } from '../services/LogService';
import { movementCancellationService } from '../services/movement/defaultCancellationService';
import {
  CancelMovementResult,
  isCancelRejection,
} from '../services/movement/types';

/** Contract the hook needs (any cancellation service implementation). */
export interface MovementCanceller {
  cancel(id: number, reason: string): Promise<CancelMovementResult>;
}

/** Runs a movement cancellation, guarding against double submission. */
export const useCancelMovement = (
  canceller: MovementCanceller = movementCancellationService,
) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const busyRef = useRef(false);

  const cancelMovement = useCallback(
    async (id: number, reason: string): Promise<CancelMovementResult> => {
      if (busyRef.current) {
        return {
          ok: false,
          failure: 'unknown',
          message: 'La cancelación ya está en proceso.',
        };
      }
      busyRef.current = true;
      setIsCancelling(true);
      try {
        const result = await canceller.cancel(id, reason);
        if (isCancelRejection(result) && result.failure === 'unknown') {
          logService.logError({
            errorType: 'MovementCancellationError',
            source: 'useCancelMovement',
            operation: 'cancelMovement',
            message: result.message,
          });
        }
        return result;
      } finally {
        busyRef.current = false;
        setIsCancelling(false);
      }
    },
    [canceller],
  );

  return { cancelMovement, isCancelling };
};
