import { PickedImage } from './types';

const DEFAULT_EXTENSION = 'jpg';
// Map (not an object literal) so keys like "__proto__" can never match.
const MIME_EXTENSIONS = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/heic', 'heic'],
  ['image/heif', 'heif'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

const SAFE_EXTENSION = /^[a-z0-9]{2,5}$/;

/**
 * Resolve a safe file extension for a picked image.
 * Priority: known MIME type → file-name extension → `jpg`.
 */
export const resolveImageExtension = (image: PickedImage): string => {
  const mime = image.mimeType?.toLowerCase().trim();
  const fromMime = mime ? MIME_EXTENSIONS.get(mime) : undefined;
  if (fromMime) {
    return fromMime;
  }

  const fromName = image.fileName?.split('.').pop()?.toLowerCase();
  if (fromName && fromName !== image.fileName?.toLowerCase()) {
    const normalized = fromName === 'jpeg' ? 'jpg' : fromName;
    if (SAFE_EXTENSION.test(normalized)) {
      return normalized;
    }
  }

  return DEFAULT_EXTENSION;
};

/** Strip characters that are unsafe in file names (keeps letters, digits, `-`, `_`). */
export const sanitizeFileBaseName = (value: string): string =>
  value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .slice(0, 64) || 'producto';
