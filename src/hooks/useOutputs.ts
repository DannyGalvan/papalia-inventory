import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { LogHeader } from '../database/models/LogHeader';
import { getAllLogsByDate } from '../database/repository/LogHeaderRepository';

export const useOutputs = (initialDate: Date, finalDate: Date) => {
  const [outputs, setOutputs] = useState<LogHeader[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    // Prevent concurrent loads which can cause infinite loops on iOS
    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const data = await getAllLogsByDate(initialDate, finalDate, false);
      setOutputs(data);
    } catch (error) {
      console.log('useOutputs error:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [initialDate, finalDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return {outputs, loadData, isLoading};
};
