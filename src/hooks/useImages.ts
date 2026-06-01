import {
    DocumentDirectoryPath,
    PicturesDirectoryPath,
    copyFile,
    exists,
    mkdir,
    unlink,
} from '@dr.pogodin/react-native-fs';
import { pick, types } from '@react-native-documents/picker';
import { useContext } from 'react';
import { Alert, Platform } from 'react-native';
import uuid from 'react-native-uuid';
import { ProductContext } from '../context/ProductContext';
import { logService } from '../services/LogService';
import { useStoragePermissions } from './useStoragePermissions';

/**
 * Resolves the base directory for storing product images.
 * - Android: PicturesDirectoryPath (shared Pictures folder, visible in Gallery)
 * - iOS: DocumentDirectoryPath (app sandbox, visible in Files app)
 */
const getImageBaseDir = (): string =>
  Platform.OS === 'android' ? PicturesDirectoryPath : DocumentDirectoryPath;

/**
 * Normalise a URI returned by the document picker so RNFS file operations
 * receive a plain filesystem path.
 *
 * - `file:///...` → strip scheme → `/...`  (iOS + some Android)
 * - `content://...` → leave as-is  (Android ContentResolver; RNFS handles it)
 */
const resolvePickerUri = (uri: string): string =>
  uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;

export const useImages = () => {
  const {checkStoragePermissions} = useStoragePermissions();
  const {dirImages, changeDirImages, isLoading, setIsLoading} =
    useContext(ProductContext);

  const uploadImage = async ({
    updateForm,
    nameImage,
    afterImage,
  }: {
    updateForm: (data: any, field: string) => void;
    nameImage: string;
    afterImage: string;
  }) => {
    try {
      setIsLoading(true);

      if (nameImage === '') {
        Alert.alert(
          'Error',
          'El producto debe contar con un código para subir imagen',
        );
        setIsLoading(false);
        return;
      }

      // Android: check runtime permissions before opening the picker.
      // iOS: the system document picker handles its own permissions.
      if (Platform.OS === 'android') {
        const granted = await checkStoragePermissions();
        if (!granted) {
          Alert.alert(
            'Permisos requeridos',
            'No se otorgaron los permisos necesarios para acceder a las imágenes. Habilítalos desde Configuración del dispositivo.',
          );
          setIsLoading(false);
          return;
        }
      }

      const res = await pick({ type: [types.images] });
      const pickedUri = res[0].uri;

      const baseDir = getImageBaseDir();
      const saveDir = `${baseDir}/${dirImages}`;

      const dirExists = await exists(saveDir);
      if (!dirExists) {
        await mkdir(saveDir, {
          NSURLIsExcludedFromBackupKey: true,
          NSFileProtectionKey: 'NSFileProtectionNone',
        });
      }

      // Infer extension from MIME type, fall back to 'jpg'.
      const extension = res[0].type?.split('/')[1] || 'jpg';
      const destPath = `${saveDir}/${nameImage}_${uuid.v4()}.${extension}`;

      // Remove the previous image for this product if it exists.
      if (afterImage) {
        const previousPath = afterImage.replace(/^file:\/\//, '');
        const previousExists = await exists(previousPath);
        if (previousExists) {
          await unlink(previousPath);
        }
      }

      // copyFile handles both file:// URIs and content:// URIs on Android.
      // On iOS the picker always returns file:// URIs.
      await copyFile(pickedUri, destPath);

      // Store absolute path with the file:// scheme so RN <Image> can render it.
      updateForm(`file://${destPath}`, 'image');

      setIsLoading(false);
      Alert.alert('Éxito', 'Imagen guardada correctamente');
    } catch (error: any) {
      // User dismissed the picker — silently return without an error dialog.
      if (error && 'code' in error && error.code === 'OPERATION_CANCELED') {
        setIsLoading(false);
        return;
      }

      logService.logError({
        errorType: error?.name || 'ImageUploadError',
        source: 'useImages',
        operation: 'uploadImage',
        message: error?.message || 'Error al subir imagen',
      });

      Alert.alert(
        'Error al subir la imagen',
        'No se pudo guardar la imagen. Verifica los permisos e intenta de nuevo.',
      );
      setIsLoading(false);
    }
  };

  return {
    dirImages,
    changeDirImages,
    isLoading,
    uploadImage,
  };
};
