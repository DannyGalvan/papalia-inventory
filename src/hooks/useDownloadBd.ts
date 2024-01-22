import {
  DocumentDirectoryPath,
  DownloadDirectoryPath,
  copyFile,
} from '@dr.pogodin/react-native-fs';
import { Alert } from 'react-native';
import { NAME_BD } from '../config/constants';
import uuid from 'react-native-uuid';

export const useDownloadBd = () => {
  const save = async () => {
    try {
      const nameBdSave = `${NAME_BD}_${uuid.v4()}`;
      const from = `${DocumentDirectoryPath}/${NAME_BD}`;
      const to = `${DownloadDirectoryPath}/${nameBdSave}`;

      await copyFile(from, to);

      Alert.alert(
        'Exito',
        `Base de datos guardada en descargas como: ${nameBdSave}`,
      );
    } catch (error) {
      Alert.alert('Error', 'Error al guardar base de datos', error.message);
    }
  };

  return { save };
};
