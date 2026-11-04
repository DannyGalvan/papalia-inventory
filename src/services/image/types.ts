/**
 * Shared contracts for the product image feature.
 *
 * Each collaborator depends on these abstractions rather than on concrete
 * native modules, so sources (camera / gallery), storage and permission
 * checks can be swapped or mocked independently (Dependency Inversion).
 */

/** Where the user wants the image to come from. */
export type ImageSourceKind = 'camera' | 'library';

/** A transient image returned by a source, before it is persisted. */
export interface PickedImage {
  /** Native URI of the temporary file (usually `file://…`). */
  uri: string;
  /** MIME type reported by the OS, e.g. `image/jpeg`. */
  mimeType?: string;
  /** Original file name reported by the OS, if any. */
  fileName?: string;
}

/** Produces an image from a single origin (camera, gallery, …). */
export interface ImageSource {
  /** Resolves with the picked image, or `null` when the user cancelled. */
  pick(): Promise<PickedImage | null>;
}

/** Persists picked images in the app's permanent image folder. */
export interface ImageStorage {
  /**
   * Copy `image` into `directory` using `baseName` as file-name prefix.
   * Resolves with the stored `file://` URI.
   */
  save(
    image: PickedImage,
    directory: string,
    baseName: string,
  ): Promise<string>;
  /** Delete a previously stored image. Missing files are ignored. */
  remove(storedUri: string): Promise<void>;
}

/** Grants (or denies) access to the storage used for product images. */
export interface StorageAccessGate {
  ensureAccess(): Promise<boolean>;
}
