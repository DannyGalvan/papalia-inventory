import { useCallback, useEffect, useRef, useState } from 'react';
import { LogHeader } from '../database/models/LogHeader';
import { getLogById } from '../database/repository/LogHeaderRepository';

type LoadMovement = (id: number) => Promise<LogHeader | null>;

/** Loads one movement (with details) and exposes a `reload`. */
export const useMovementDetail = (
  id: number,
  loadMovement: LoadMovement = getLogById,
) => {
  const [movement, setMovement] = useState<LogHeader | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadMovement(id);
      if (mountedRef.current) {
        setMovement(data);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, loadMovement]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { movement, isLoading, reload };
};
