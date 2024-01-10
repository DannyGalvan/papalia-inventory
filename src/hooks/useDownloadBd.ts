import {
  DocumentDirectoryPath,
  DownloadDirectoryPath,
  copyFile,
} from '@dr.pogodin/react-native-fs';
import {Alert} from 'react-native';
import {NAME_BD} from '../config/constants';

export const useDownloadBd = () => {
  const save = async () => {
    try {
      const from = `${DocumentDirectoryPath}/${NAME_BD}`;
      const to = `${DownloadDirectoryPath}/${NAME_BD}`;

      await copyFile(from, to);

      Alert.alert(
        'Exito',
        `Base de datos guardada en descargas como: ${NAME_BD}`,
      );
    } catch (error) {
      Alert.alert('Error', 'Error al guardar base de datos', error.message);
    }
  };

  return {save};
};
