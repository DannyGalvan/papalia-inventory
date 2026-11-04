import type { ImagePickerResponse } from 'react-native-image-picker';
import { ImagePickerError } from './ImagePickerError';
import { PickedImage } from './types';

/**
 * Translate a `react-native-image-picker` response into the app contract.
 *  - Cancelled / empty response → `null`.
 *  - Native error → {@link ImagePickerError} with a normalized code.
 *  - Otherwise → the first asset as a {@link PickedImage}.
 */
export const mapPickerResponse = (
  response: ImagePickerResponse,
): PickedImage | null => {
  if (response.didCancel) {
    return null;
  }

  if (response.errorCode) {
    const code =
      response.errorCode === 'camera_unavailable' ||
      response.errorCode === 'permission'
        ? response.errorCode
        : 'unknown';
    throw new ImagePickerError(code, response.errorMessage);
  }

  const asset = response.assets?.[0];
  if (!asset?.uri) {
    return null;
  }

  return {
    uri: asset.uri,
    mimeType: asset.type,
    fileName: asset.fileName,
  };
};
