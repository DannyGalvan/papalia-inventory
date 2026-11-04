import uuid from 'react-native-uuid';
import { resolveImageUri, toFsPath } from '../../utils/filePaths';
import { resolveImageExtension, sanitizeFileBaseName } from './imageExtension';
import { ImageStorage, PickedImage } from './types';

/** Minimal file-system surface needed by the storage (eases mocking). */
export interface FileSystemPort {
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  copyFile(from: string, to: string): Promise<void>;
  unlink(path: string): Promise<void>;
}

/**
 * Stores product images under `<baseDir>/<directory>` with a unique name
 * (`<code>_<uuid>.<ext>`) so React Native never serves a stale cached image
 * after a replacement.
 */
export class FileSystemImageStorage implements ImageStorage {
  constructor(
    private readonly fs: FileSystemPort,
    private readonly getBaseDir: () => string,
    private readonly createId: () => string = () => String(uuid.v4()),
  ) {}

  async save(
    image: PickedImage,
    directory: string,
    baseName: string,
  ): Promise<string> {
    const saveDir = `${this.getBaseDir()}/${directory}`;
    if (!(await this.fs.exists(saveDir))) {
      await this.fs.mkdir(saveDir);
    }

    const extension = resolveImageExtension(image);
    const destPath = `${saveDir}/${sanitizeFileBaseName(
      baseName,
    )}_${this.createId()}.${extension}`;

    // copyFile needs a plain path on iOS; content:// URIs work on Android.
    await this.fs.copyFile(toFsPath(image.uri), destPath);

    // file:// scheme lets RN <Image> render the stored file.
    return `file://${destPath}`;
  }

  async remove(storedUri: string): Promise<void> {
    if (!storedUri) {
      return;
    }
    // Rebase onto the current container (iOS sandbox path changes on update).
    const path = toFsPath(resolveImageUri(storedUri));
    if (await this.fs.exists(path)) {
      await this.fs.unlink(path);
    }
  }
}
