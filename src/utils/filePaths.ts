import { Platform } from 'react-native';

/**
 * Convert a URI returned by the document picker (or stored in the DB) into a
 * plain filesystem path usable by react-native-fs.
 *
 * - `file:///...` → strip scheme and percent-decode (iOS returns encoded URIs,
 *   e.g. `Mis%20productos.xlsx`, which RNFS cannot open as-is).
 * - `content://...` → left untouched (Android ContentResolver; RNFS handles it).
 */
export const toFsPath = (uri: string): string => {
  if (!uri.startsWith('file://')) {
    return uri;
  }
  const path = uri.replace(/^file:\/\//, '');
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

let cachedDocumentDir: string | undefined;

/**
 * Lazily read the current Documents directory. Loaded on demand so modules
 * that only render images do not require the native RNFS module at import
 * time (keeps Jest component tests independent of native mocks).
 */
const getDocumentDir = (): string => {
  if (cachedDocumentDir === undefined) {
    try {
      cachedDocumentDir =
        require('@dr.pogodin/react-native-fs').DocumentDirectoryPath ?? '';
    } catch {
      cachedDocumentDir = '';
    }
  }
  return cachedDocumentDir as string;
};

const IOS_DOCUMENTS_SEGMENT = '/Documents/';

/**
 * Resolve a stored image URI so it points to the current app container.
 *
 * On iOS the app sandbox path (`.../Application/<UUID>/Documents`) changes on
 * every app update or reinstall, so absolute paths saved in the database go
 * stale. Everything after `/Documents/` is stable, so the path is rebased onto
 * the current Documents directory. Android paths are returned unchanged.
 */
export const resolveImageUri = (image?: string | null): string => {
  if (!image) {
    return '';
  }
  if (Platform.OS !== 'ios' || !image.startsWith('file://')) {
    return image;
  }
  const index = image.indexOf(IOS_DOCUMENTS_SEGMENT);
  const documentDir = getDocumentDir();
  if (index === -1 || !documentDir) {
    return image;
  }
  const relative = image.substring(index + IOS_DOCUMENTS_SEGMENT.length);
  return `file://${documentDir}/${relative}`;
};
