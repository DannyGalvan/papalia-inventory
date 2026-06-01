/**
 * Cross-platform file system service.
 *
 * `FileService` abstracts away the platform differences involved in resolving
 * a "downloads" location, requesting the permissions required for file
 * operations, checking for file existence, and writing files to disk.
 *
 * Path resolution:
 *  - Android: the public Downloads directory (`DownloadDirectoryPath`), so the
 *    exported file is visible to the user through the device file manager.
 *  - iOS: the app's Documents directory (`DocumentDirectoryPath`), which is
 *    exposed to the user through the Files app and requires no runtime
 *    permission to write to.
 *
 * Permission handling follows the platform-appropriate APIs:
 *  - Android 10+ (API level 29+) uses Scoped Storage, under which apps may
 *    write to their downloads location without the legacy
 *    `WRITE_EXTERNAL_STORAGE` permission, so no runtime request is needed.
 *  - Android 9 and below (API < 29) require the legacy
 *    `WRITE_EXTERNAL_STORAGE` runtime permission.
 *  - iOS writes to the sandboxed Documents directory, which needs no runtime
 *    permission.
 *
 * When a permission is denied the service does not throw or crash. Instead it
 * records a user-friendly Spanish message (retrievable via
 * {@link FileService.getPermissionDeniedMessage}) explaining which feature is
 * unavailable, and returns `false` from {@link FileService.requestPermissions}.
 *
 * A singleton instance ({@link fileService}) is exported so that services and
 * components share a single implementation.
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

import {
    DocumentDirectoryPath,
    DownloadDirectoryPath,
    exists,
    writeFile as rnfsWriteFile,
} from '@dr.pogodin/react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';
import { logService } from './LogService';

/**
 * The Android API level (29) at which Scoped Storage became the default. From
 * this level onwards the legacy `WRITE_EXTERNAL_STORAGE` permission is no
 * longer required to write to the public Downloads collection.
 */
const ANDROID_SCOPED_STORAGE_API_LEVEL = 29;

/**
 * User-facing Spanish messages shown when a required permission is denied.
 * These explain which feature becomes unavailable so the user understands the
 * consequence of the denial (Requirement 6.5).
 */
export const PERMISSION_DENIED_MESSAGES = {
  /** Storage permission denied: file export/import is unavailable. */
  storage:
    'No se otorgaron permisos de almacenamiento. La exportación e importación de archivos Excel no estará disponible hasta que concedas el permiso desde la configuración del dispositivo.',
  /** Unexpected error while requesting permissions. */
  unknown:
    'No se pudieron verificar los permisos de almacenamiento. La exportación de archivos no está disponible en este momento.',
} as const;

/**
 * Contract for cross-platform file system access.
 */
export interface FileService {
  /**
   * Resolve the directory where exported files should be saved:
   * Downloads on Android, Documents on iOS.
   */
  getDownloadsPath(): string;
  /**
   * Request the permissions required for file operations using the
   * platform-appropriate API. Resolves to `true` when the app may proceed with
   * file operations, `false` otherwise. Never throws.
   */
  requestPermissions(): Promise<boolean>;
  /**
   * Check whether a file exists at the given absolute path.
   */
  fileExists(path: string): Promise<boolean>;
  /**
   * Write `content` to `path` using the given `encoding` (e.g. `'utf8'`,
   * `'ascii'`, `'base64'`).
   */
  writeFile(path: string, content: string, encoding: string): Promise<void>;
  /**
   * Return the Spanish message describing the most recent permission denial,
   * or an empty string when the last permission request succeeded. Consumers
   * can surface this to the user (Requirement 6.5).
   */
  getPermissionDeniedMessage(): string;
}

/**
 * Default platform-adaptive implementation of {@link FileService}.
 */
export class FileServiceImpl implements FileService {
  /** Holds the most recent permission-denied message, or '' when granted. */
  private deniedMessage = '';

  getDownloadsPath(): string {
    // Android exposes a public Downloads directory; iOS uses the sandboxed
    // Documents directory which the Files app surfaces to the user.
    return Platform.OS === 'android'
      ? DownloadDirectoryPath
      : DocumentDirectoryPath;
  }

  async requestPermissions(): Promise<boolean> {
    // Reset any previous denial message at the start of a new request.
    this.deniedMessage = '';

    // iOS writes to the sandboxed Documents directory, which requires no
    // runtime permission.
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const apiLevel = parseInt(Platform.Version.toString(), 10);

      // Android 10+ (API 29+) uses Scoped Storage: writing to the downloads
      // location does not require the legacy WRITE_EXTERNAL_STORAGE permission.
      if (Number.isNaN(apiLevel) || apiLevel >= ANDROID_SCOPED_STORAGE_API_LEVEL) {
        return true;
      }

      // Android 9 and below need the legacy storage permission.
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );

      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      if (!granted) {
        this.deniedMessage = PERMISSION_DENIED_MESSAGES.storage;
      }
      return granted;
    } catch (error) {
      const err = error as Error;
      logService.logError({
        errorType: err?.name || 'PermissionError',
        source: 'FileService',
        operation: 'requestPermissions',
        message: err?.message || 'Error solicitando permisos de almacenamiento',
      });
      this.deniedMessage = PERMISSION_DENIED_MESSAGES.unknown;
      return false;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      return await exists(path);
    } catch (error) {
      const err = error as Error;
      logService.logError({
        errorType: err?.name || 'FileSystemError',
        source: 'FileService',
        operation: 'fileExists',
        message: err?.message || `No se pudo verificar el archivo: ${path}`,
      });
      return false;
    }
  }

  async writeFile(
    path: string,
    content: string,
    encoding: string,
  ): Promise<void> {
    try {
      // The underlying library accepts the encoding as a string union
      // ('utf8' | 'ascii' | 'base64'); the FileService interface keeps it
      // loosely typed as `string` for ergonomics.
      await rnfsWriteFile(path, content, encoding as 'utf8' | 'ascii' | 'base64');
    } catch (error) {
      const err = error as Error;
      logService.logError({
        errorType: err?.name || 'FileSystemError',
        source: 'FileService',
        operation: 'writeFile',
        message: err?.message || `No se pudo guardar el archivo: ${path}`,
      });
      // Re-throw so callers can surface a user-facing error and stop the flow.
      throw new Error('No se pudo guardar el archivo');
    }
  }

  getPermissionDeniedMessage(): string {
    return this.deniedMessage;
  }
}

/**
 * Shared singleton instance. Import this to perform file operations anywhere in
 * the app so that all consumers share the same implementation.
 */
export const fileService: FileService = new FileServiceImpl();
