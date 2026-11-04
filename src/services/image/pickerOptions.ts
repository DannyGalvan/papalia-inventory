import type {
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';

/**
 * Images are downscaled and re-encoded natively before reaching JS so stored
 * files stay small (fast list rendering, lower disk usage) while remaining
 * sharp enough for a product photo.
 */
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.8;

const COMMON = {
  mediaType: 'photo',
  maxWidth: MAX_DIMENSION,
  maxHeight: MAX_DIMENSION,
  quality: JPEG_QUALITY,
  includeBase64: false,
  includeExtra: false,
  // Converts HEIC/HEIF to a widely compatible format on iOS.
  assetRepresentationMode: 'compatible',
} as const;

export const CAMERA_OPTIONS: CameraOptions = {
  ...COMMON,
  cameraType: 'back',
  // Photos stay inside the app; saving to the camera roll would require the
  // extra "add to Photos" permission and duplicate the file.
  saveToPhotos: false,
};

export const LIBRARY_OPTIONS: ImageLibraryOptions = {
  ...COMMON,
  selectionLimit: 1,
};
