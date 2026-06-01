/**
 * Cross-platform storage/media permission handler.
 *
 * Android:
 *  - API 33+ (Android 13): Requests READ_MEDIA_IMAGES for image access.
 *    No write permission needed (Scoped Storage handles it).
 *  - API 29-32 (Android 10-12): No runtime permission needed for app-specific
 *    or Downloads directories (Scoped Storage). READ_EXTERNAL_STORAGE for
 *    reading images from shared storage.
 *  - API < 29 (Android 9 and below): Requests WRITE_EXTERNAL_STORAGE and
 *    READ_EXTERNAL_STORAGE (legacy storage model).
 *
 * iOS:
 *  - Photo Library access is handled by the document picker itself
 *    (it uses the system picker which doesn't require explicit permission).
 *  - For saving to Photos, NSPhotoLibraryAddUsageDescription is needed in
 *    Info.plist, but this app saves to the file system, not Photos.
 *  - Always returns true since file operations use the sandboxed Documents dir.
 *
 * Requirements: 6.4, 6.5
 */

import { PermissionsAndroid, Platform } from 'react-native';
import { logService } from '../services/LogService';

export interface PermissionResult {
  granted: boolean;
  message: string;
}

export const useStoragePermissions = () => {
  const checkStoragePermissions = async (): Promise<boolean> => {
    // iOS: No runtime permissions needed for file system access.
    // The document picker handles its own permissions via system UI.
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const apiLevel = parseInt(Platform.Version.toString(), 10);

      // Android 13+ (API 33): Need READ_MEDIA_IMAGES for image gallery access
      if (apiLevel >= 33) {
        const imagePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Permiso de acceso a imágenes',
            message:
              'Papalia Inventory necesita acceso a tus imágenes para poder asignar fotos a los productos.',
            buttonPositive: 'Permitir',
            buttonNegative: 'Denegar',
          },
        );

        if (imagePermission !== PermissionsAndroid.RESULTS.GRANTED) {
          logService.logError({
            errorType: 'PermissionDenied',
            source: 'useStoragePermissions',
            operation: 'READ_MEDIA_IMAGES',
            message: 'Permiso de imágenes denegado en Android 13+',
          });
          return false;
        }

        return true;
      }

      // Android 10-12 (API 29-32): Scoped Storage — no write permission needed.
      // READ_EXTERNAL_STORAGE for reading images from shared storage.
      if (apiLevel >= 29) {
        const readPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Permiso de lectura de almacenamiento',
            message:
              'Papalia Inventory necesita acceso al almacenamiento para leer imágenes de productos.',
            buttonPositive: 'Permitir',
            buttonNegative: 'Denegar',
          },
        );

        if (readPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          logService.logError({
            errorType: 'PermissionDenied',
            source: 'useStoragePermissions',
            operation: 'READ_EXTERNAL_STORAGE',
            message: 'Permiso de lectura denegado en Android 10-12',
          });
          return false;
        }

        return true;
      }

      // Android 9 and below (API < 29): Legacy storage model
      const writePermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permiso de almacenamiento',
          message:
            'Papalia Inventory necesita acceso al almacenamiento para guardar archivos e imágenes.',
          buttonPositive: 'Permitir',
          buttonNegative: 'Denegar',
        },
      );

      if (writePermission !== PermissionsAndroid.RESULTS.GRANTED) {
        logService.logError({
          errorType: 'PermissionDenied',
          source: 'useStoragePermissions',
          operation: 'WRITE_EXTERNAL_STORAGE',
          message: 'Permiso de escritura denegado en Android 9-',
        });
        return false;
      }

      return true;
    } catch (error) {
      const err = error as Error;
      logService.logError({
        errorType: err?.name || 'PermissionError',
        source: 'useStoragePermissions',
        operation: 'checkStoragePermissions',
        message: err?.message || 'Error al verificar permisos',
      });
      return false;
    }
  };

  return {
    checkStoragePermissions,
  };
};
