import {useCallback, useState} from 'react';
import {getAllLogsByDate} from '../database/repository/LogHeaderRepository';
import {useFocusEffect} from '@react-navigation/native';
import {LogHeader} from '../database/models/LogHeader';

export const useOutputs = (initialDate: Date, finalDate: Date) => {
  const [outputs, setOutputs] = useState<LogHeader[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    (async () => {
      setIsLoading(true);
      const data = getAllLogsByDate(initialDate, finalDate, false);
      setOutputs(await data);
      setIsLoading(false);
    })();
  };

  useFocusEffect(useCallback(loadData, [initialDate, finalDate]));

  return {outputs, loadData, isLoading};
};
