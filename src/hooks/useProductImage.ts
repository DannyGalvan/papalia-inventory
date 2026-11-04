import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ProductContext } from '../context/ProductContext';
import { logService } from '../services/LogService';
import { createProductImageService } from '../services/image/createProductImageService';
import { ImagePickerError } from '../services/image/ImagePickerError';
import { ProductImageService } from '../services/image/ProductImageService';
import { ImageSourceKind } from '../services/image/types';
import { getErrorMessage, getErrorName } from '../utils/getErrorMessage';
import { useStoragePermissions } from './useStoragePermissions';

export interface AcquireProductImageParams {
  source: ImageSourceKind;
  productCode: string;
  /** Image currently shown in the form. */
  currentImage: string;
  /** Image persisted in the database (never deleted before saving). */
  persistedImage: string;
}

/**
 * UI-facing hook to take or pick a product photo.
 * Delegates all work to {@link ProductImageService}; this hook only manages
 * the busy state and user feedback.
 */
export const useProductImage = (serviceOverride?: ProductImageService) => {
  const { dirImages } = useContext(ProductContext);
  const { checkStoragePermissions } = useStoragePermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const busyRef = useRef(false);

  // The gate reads through a ref so the memoized service never goes stale.
  const checkRef = useRef(checkStoragePermissions);
  checkRef.current = checkStoragePermissions;

  const service = useMemo(
    () =>
      serviceOverride ??
      createProductImageService({ ensureAccess: () => checkRef.current() }),
    [serviceOverride],
  );

  const acquireImage = useCallback(
    async ({
      source,
      productCode,
      currentImage,
      persistedImage,
    }: AcquireProductImageParams): Promise<string | null> => {
      // Ignore double taps while a picker is already open.
      if (busyRef.current) {
        return null;
      }
      busyRef.current = true;
      setIsProcessing(true);
      try {
        return await service.acquire({
          source,
          productCode,
          directory: dirImages,
          discardUri:
            currentImage && currentImage !== persistedImage
              ? currentImage
              : undefined,
        });
      } catch (error: unknown) {
        if (error instanceof ImagePickerError) {
          Alert.alert('Imagen del producto', error.userMessage);
        } else {
          Alert.alert(
            'Error al subir la imagen',
            'No se pudo guardar la imagen. Verifica los permisos e intenta de nuevo.',
          );
        }
        logService.logError({
          errorType: getErrorName(error, 'ImageUploadError'),
          source: 'useProductImage',
          operation: `acquireImage:${source}`,
          message: getErrorMessage(error, 'Error al subir imagen'),
        });
        return null;
      } finally {
        busyRef.current = false;
        setIsProcessing(false);
      }
    },
    [service, dirImages],
  );

  const discardImage = useCallback(
    (uri: string) => service.discard(uri),
    [service],
  );

  return { acquireImage, discardImage, isProcessing };
};
