import {
    DocumentDirectoryPath,
    DownloadDirectoryPath,
    copyFile,
} from '@dr.pogodin/react-native-fs';
import { useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import uuid from 'react-native-uuid';
import { NAME_BD } from '../config/constants';

export interface DownloadResult {
  success: boolean;
  message: string;
}

/**
 * On Android the DB copy goes to the public Downloads directory (visible in
 * the file manager). On iOS there is no public Downloads folder; the copy goes
 * to the app's Documents directory, which is accessible from the Files app
 * under "On My iPhone/iPad → <AppName>".
 */
const getTargetDir = (): string =>
  Platform.OS === 'android' ? DownloadDirectoryPath : DocumentDirectoryPath;

/**
 * Request WRITE_EXTERNAL_STORAGE on Android 9 and below (API < 29).
 * Scoped Storage (API 29+) and iOS do not require this permission.
 * Returns true when the operation may proceed.
 */
const ensureWritePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }
  const apiLevel = parseInt(Platform.Version.toString(), 10);
  if (apiLevel >= 29) {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Permiso de almacenamiento',
      message: 'Se necesita permiso para guardar la base de datos en Descargas.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Cancelar',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const useDownloadBd = () => {
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);

  const save = async () => {
    try {
      const permitted = await ensureWritePermission();
      if (!permitted) {
        setDownloadResult({
          success: false,
          message: 'Permiso de almacenamiento denegado. Habilítalo desde Configuración del dispositivo.',
        });
        return;
      }

      const nameBdSave = `${NAME_BD}_${uuid.v4()}`;
      const from = `${DocumentDirectoryPath}/${NAME_BD}`;
      const to = `${getTargetDir()}/${nameBdSave}`;

      await copyFile(from, to);

      const location =
        Platform.OS === 'ios'
          ? 'Archivos → En mi iPhone/iPad → Inventory Management'
          : 'Descargas';

      setDownloadResult({
        success: true,
        message: `Base de datos guardada en ${location} como: ${nameBdSave}`,
      });
    } catch (error: any) {
      setDownloadResult({
        success: false,
        message: error?.message || 'Error al guardar la base de datos',
      });
    }
  };

  const clearResult = () => {
    setDownloadResult(null);
  };

  return { save, downloadResult, clearResult };
};
