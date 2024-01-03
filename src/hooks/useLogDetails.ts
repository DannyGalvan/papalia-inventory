import {useState} from 'react';
import {LogDetail} from '../database/models/LogDetail';
import {Alert} from 'react-native';

export const useLogDetails = () => {
  const [details, setDetails] = useState<LogDetail[]>([]);
  const [lastGeneratedId, setLastGeneratedId] = useState<number[]>([]);

  const addDetail = (
    detail: LogDetail,
    updateForm: (data: any, field: string) => void,
  ) => {
    if (details.some(d => d.productCode === detail.productCode)) {
      Alert.alert('Error', 'Este producto ya fue agregado');
      return;
    }
    const newDetails = [...details, detail];
    setDetails(newDetails);
    updateForm(newDetails, 'logDetails');
  };

  const updateDetail = (detail: LogDetail, index: number) => {
    const newDetails = [...details];
    newDetails[index] = detail;
    setDetails(newDetails);
  };

  const removeDetail = (
    id: number,
    updateForm: (data: any, field: string) => void,
  ) => {
    const newDetails = details.filter(d => d.id !== id);
    setDetails(newDetails);
    updateForm(newDetails, 'logDetails');
  };

  const clearDetails = () => {
    setDetails([]);
  };

  const generateRandomId = () => {
    let id = Math.floor(Math.random() * 1000000);
    while (lastGeneratedId.includes(id)) {
      id = Math.floor(Math.random() * 1000000);
    }
    setLastGeneratedId([...lastGeneratedId, id]);
    return id;
  };

  return {
    details,
    addDetail,
    removeDetail,
    updateDetail,
    clearDetails,
    generateRandomId,
  };
};
