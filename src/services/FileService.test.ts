/**
 * Unit tests for FileService.
 *
 * Verifies cross-platform path resolution (Downloads on Android, Documents on
 * iOS), platform-appropriate permission handling (Scoped Storage on Android
 * 10+, legacy WRITE_EXTERNAL_STORAGE below, none on iOS), Spanish denial
 * messaging, file existence checks, and write delegation/error handling.
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

import { Platform } from 'react-native';

// Mock the native file system library before importing the service under test.
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DownloadDirectoryPath: '/storage/emulated/0/Download',
  DocumentDirectoryPath: '/var/mobile/Documents',
  exists: jest.fn(),
  writeFile: jest.fn(),
}));

import {
    exists as rnfsExists,
    writeFile as rnfsWriteFile,
} from '@dr.pogodin/react-native-fs';
import {
    FileServiceImpl,
    PERMISSION_DENIED_MESSAGES,
} from './FileService';

const mockedExists = rnfsExists as jest.MockedFunction<typeof rnfsExists>;
const mockedWriteFile = rnfsWriteFile as jest.MockedFunction<
  typeof rnfsWriteFile
>;

// Spy on PermissionsAndroid.request via the react-native mock.
const requestSpy = jest.spyOn(
  require('react-native').PermissionsAndroid,
  'request',
);

/** Helper to override the (read-only in types) Platform fields for a test. */
function setPlatform(os: 'android' | 'ios', version: number | string): void {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  Object.defineProperty(Platform, 'Version', {
    value: version,
    configurable: true,
  });
}

describe('FileServiceImpl', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDownloadsPath', () => {
    it('returns the Downloads directory on Android', () => {
      setPlatform('android', 30);
      const service = new FileServiceImpl();
      expect(service.getDownloadsPath()).toBe('/storage/emulated/0/Download');
    });

    it('returns the Documents directory on iOS', () => {
      setPlatform('ios', '15.1');
      const service = new FileServiceImpl();
      expect(service.getDownloadsPath()).toBe('/var/mobile/Documents');
    });
  });

  describe('requestPermissions', () => {
    it('grants without a runtime request on iOS', async () => {
      setPlatform('ios', '15.1');
      const service = new FileServiceImpl();

      await expect(service.requestPermissions()).resolves.toBe(true);
      expect(requestSpy).not.toHaveBeenCalled();
      expect(service.getPermissionDeniedMessage()).toBe('');
    });

    it('grants without a runtime request on Android 10+ (Scoped Storage)', async () => {
      setPlatform('android', 33);
      const service = new FileServiceImpl();

      await expect(service.requestPermissions()).resolves.toBe(true);
      expect(requestSpy).not.toHaveBeenCalled();
      expect(service.getPermissionDeniedMessage()).toBe('');
    });

    it('requests legacy storage permission on Android 9 and below', async () => {
      setPlatform('android', 28);
      requestSpy.mockResolvedValueOnce('granted');
      const service = new FileServiceImpl();

      await expect(service.requestPermissions()).resolves.toBe(true);
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(service.getPermissionDeniedMessage()).toBe('');
    });

    it('returns false with a Spanish message when storage permission is denied', async () => {
      setPlatform('android', 28);
      requestSpy.mockResolvedValueOnce('denied');
      const service = new FileServiceImpl();

      await expect(service.requestPermissions()).resolves.toBe(false);
      expect(service.getPermissionDeniedMessage()).toBe(
        PERMISSION_DENIED_MESSAGES.storage,
      );
    });

    it('returns false with a Spanish message when the request throws', async () => {
      setPlatform('android', 28);
      requestSpy.mockRejectedValueOnce(new Error('boom'));
      const service = new FileServiceImpl();

      await expect(service.requestPermissions()).resolves.toBe(false);
      expect(service.getPermissionDeniedMessage()).toBe(
        PERMISSION_DENIED_MESSAGES.unknown,
      );
    });

    it('clears a prior denial message on a subsequent successful request', async () => {
      setPlatform('android', 28);
      const service = new FileServiceImpl();

      requestSpy.mockResolvedValueOnce('denied');
      await service.requestPermissions();
      expect(service.getPermissionDeniedMessage()).not.toBe('');

      requestSpy.mockResolvedValueOnce('granted');
      await service.requestPermissions();
      expect(service.getPermissionDeniedMessage()).toBe('');
    });
  });

  describe('fileExists', () => {
    it('delegates to the native exists call', async () => {
      setPlatform('android', 30);
      mockedExists.mockResolvedValueOnce(true);
      const service = new FileServiceImpl();

      await expect(service.fileExists('/some/file.xlsx')).resolves.toBe(true);
      expect(mockedExists).toHaveBeenCalledWith('/some/file.xlsx');
    });

    it('returns false when the native exists call throws', async () => {
      setPlatform('android', 30);
      mockedExists.mockRejectedValueOnce(new Error('io error'));
      const service = new FileServiceImpl();

      await expect(service.fileExists('/bad/path')).resolves.toBe(false);
    });
  });

  describe('writeFile', () => {
    it('delegates to the native writeFile call with the given encoding', async () => {
      setPlatform('android', 30);
      mockedWriteFile.mockResolvedValueOnce(undefined);
      const service = new FileServiceImpl();

      await service.writeFile('/path/out.xlsx', 'data', 'base64');
      expect(mockedWriteFile).toHaveBeenCalledWith(
        '/path/out.xlsx',
        'data',
        'base64',
      );
    });

    it('throws a Spanish error when the native writeFile call fails', async () => {
      setPlatform('android', 30);
      mockedWriteFile.mockRejectedValueOnce(new Error('disk full'));
      const service = new FileServiceImpl();

      await expect(
        service.writeFile('/path/out.xlsx', 'data', 'utf8'),
      ).rejects.toThrow('No se pudo guardar el archivo');
    });
  });
});
