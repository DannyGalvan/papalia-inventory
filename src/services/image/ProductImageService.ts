import { ImagePickerError } from './ImagePickerError';
import {
  ImageSource,
  ImageSourceKind,
  ImageStorage,
  StorageAccessGate,
} from './types';

export interface AcquireImageRequest {
  source: ImageSourceKind;
  /** Product code used as file-name prefix. */
  productCode: string;
  /** Sub-folder (configurable from Configuración) where images live. */
  directory: string;
  /**
   * A previously acquired image that was never persisted with the product
   * (e.g. the user changes the photo twice before saving). It is removed once
   * the new image is safely stored, avoiding orphan files.
   */
  discardUri?: string;
}

/**
 * Orchestrates acquiring a product image: permission gate → source → storage.
 * Depends only on abstractions, so each collaborator is replaceable.
 */
export class ProductImageService {
  constructor(
    private readonly sources: Record<ImageSourceKind, ImageSource>,
    private readonly storage: ImageStorage,
    private readonly accessGate: StorageAccessGate,
  ) {}

  /**
   * Resolves with the stored `file://` URI, or `null` if the user cancelled.
   * Throws {@link ImagePickerError} on any recoverable failure.
   */
  async acquire(request: AcquireImageRequest): Promise<string | null> {
    if (!request.productCode.trim()) {
      throw new ImagePickerError('missing_code');
    }

    if (!(await this.accessGate.ensureAccess())) {
      throw new ImagePickerError('storage_permission');
    }

    const picked = await this.sources[request.source].pick();
    if (!picked) {
      return null;
    }

    const storedUri = await this.storage.save(
      picked,
      request.directory,
      request.productCode,
    );

    // Only after the new file exists do we drop the unsaved previous one.
    if (request.discardUri && request.discardUri !== storedUri) {
      await this.discard(request.discardUri);
    }

    return storedUri;
  }

  /** Best-effort removal of a stored image; never throws. */
  async discard(storedUri: string): Promise<void> {
    try {
      await this.storage.remove(storedUri);
    } catch {
      // A leftover file is harmless; never block the user flow on cleanup.
    }
  }
}
