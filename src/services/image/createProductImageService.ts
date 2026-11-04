import {
  DocumentDirectoryPath,
  PicturesDirectoryPath,
  copyFile,
  exists,
  mkdir,
  unlink,
} from '@dr.pogodin/react-native-fs';
import { Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  FileSystemImageStorage,
  FileSystemPort,
} from './FileSystemImageStorage';
import { CAMERA_OPTIONS, LIBRARY_OPTIONS } from './pickerOptions';
import { PickerImageSource } from './PickerImageSource';
import { ProductImageService } from './ProductImageService';
import { StorageAccessGate } from './types';

/**
 * Base directory for product images:
 *  - Android: shared Pictures folder (visible in the Gallery).
 *  - iOS: app sandbox Documents (visible in the Files app).
 */
const getImageBaseDir = (): string =>
  Platform.OS === 'android' ? PicturesDirectoryPath : DocumentDirectoryPath;

const nativeFileSystem: FileSystemPort = {
  exists,
  copyFile,
  unlink,
  mkdir: async path => {
    await mkdir(path, {
      NSURLIsExcludedFromBackupKey: true,
      NSFileProtectionKey: 'NSFileProtectionNone',
    });
  },
};

/** Composition root wiring the native adapters into the service. */
export const createProductImageService = (
  accessGate: StorageAccessGate,
): ProductImageService =>
  new ProductImageService(
    {
      camera: new PickerImageSource(launchCamera, CAMERA_OPTIONS),
      library: new PickerImageSource(launchImageLibrary, LIBRARY_OPTIONS),
    },
    new FileSystemImageStorage(nativeFileSystem, getImageBaseDir),
    accessGate,
  );
