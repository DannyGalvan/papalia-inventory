import {useCallback, useState} from 'react';
import {getAllLogsByDate} from '../database/repository/LogHeaderRepository';
import {useFocusEffect} from '@react-navigation/native';
import {LogHeader} from '../database/models/LogHeader';

export const useInputs = (initialDate: Date, finalDate: Date) => {
  const [inputs, setInputs] = useState<LogHeader[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    (async () => {
      setIsLoading(true);
      const data = await getAllLogsByDate(initialDate, finalDate, true);
      setInputs(data);
      setIsLoading(false);
    })();
  };

  useFocusEffect(useCallback(loadData, [initialDate, finalDate]));

  return {inputs, loadData, isLoading};
};
