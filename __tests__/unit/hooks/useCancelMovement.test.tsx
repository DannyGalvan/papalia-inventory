import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('../../../src/services/movement/defaultCancellationService', () => ({
  movementCancellationService: { cancel: jest.fn() },
}));
jest.mock('../../../src/services/LogService', () => ({
  logService: { logError: jest.fn() },
}));
jest.mock('../../../src/database/repository/LogHeaderRepository', () => ({
  getLogById: jest.fn(),
}));

import {
  MovementCanceller,
  useCancelMovement,
} from '../../../src/hooks/useCancelMovement';
import { useMovementDetail } from '../../../src/hooks/useMovementDetail';
import type { LogHeader } from '../../../src/database/models/LogHeader';
import { logService } from '../../../src/services/LogService';
import { CancelMovementResult } from '../../../src/services/movement/types';

const renderCancel = (canceller: MovementCanceller) => {
  const ref: { current: ReturnType<typeof useCancelMovement> | null } = {
    current: null,
  };
  const Harness = () => {
    ref.current = useCancelMovement(canceller);
    return null;
  };
  act(() => {
    TestRenderer.create(<Harness />);
  });
  return ref;
};

describe('useCancelMovement', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates to the canceller and resets the busy flag', async () => {
    const ok: CancelMovementResult = {
      ok: true,
      cancelledAt: new Date(),
      message: 'listo',
    };
    const canceller = { cancel: jest.fn(async () => ok) };
    const hook = renderCancel(canceller);
    let result: CancelMovementResult | null = null;
    await act(async () => {
      result = await hook.current!.cancelMovement(3, 'Motivo válido');
    });
    expect(canceller.cancel).toHaveBeenCalledWith(3, 'Motivo válido');
    expect(result).toBe(ok);
    expect(hook.current!.isCancelling).toBe(false);
    expect(logService.logError).not.toHaveBeenCalled();
  });

  it('logs unexpected failures only', async () => {
    const canceller = {
      cancel: jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          failure: 'negative_stock',
          message: 'x',
        })
        .mockResolvedValueOnce({ ok: false, failure: 'unknown', message: 'y' }),
    };
    const hook = renderCancel(canceller);
    await act(async () => {
      await hook.current!.cancelMovement(1, 'Motivo válido');
    });
    expect(logService.logError).not.toHaveBeenCalled();
    await act(async () => {
      await hook.current!.cancelMovement(1, 'Motivo válido');
    });
    expect(logService.logError).toHaveBeenCalledTimes(1);
  });

  it('prevents double submission', async () => {
    let resolve!: (r: CancelMovementResult) => void;
    const canceller = {
      cancel: jest.fn(
        () => new Promise<CancelMovementResult>(r => (resolve = r)),
      ),
    };
    const hook = renderCancel(canceller);
    let first!: Promise<CancelMovementResult>;
    let second: CancelMovementResult | null = null;
    await act(async () => {
      first = hook.current!.cancelMovement(1, 'Motivo válido');
      second = await hook.current!.cancelMovement(1, 'Motivo válido');
    });
    expect(canceller.cancel).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ ok: false });
    await act(async () => {
      resolve({ ok: true, cancelledAt: new Date(), message: 'ok' });
      await first;
    });
  });
});

describe('useMovementDetail', () => {
  it('loads the movement and reloads on demand', async () => {
    const log = { id: 5 } as LogHeader;
    const load = jest.fn(async () => log);
    const ref: { current: ReturnType<typeof useMovementDetail> | null } = {
      current: null,
    };
    const Harness = () => {
      ref.current = useMovementDetail(5, load);
      return null;
    };
    await act(async () => {
      TestRenderer.create(<Harness />);
    });
    expect(load).toHaveBeenCalledWith(5);
    expect(ref.current!.movement).toBe(log);
    expect(ref.current!.isLoading).toBe(false);

    await act(async () => {
      await ref.current!.reload();
    });
    expect(load).toHaveBeenCalledTimes(2);
  });
});
