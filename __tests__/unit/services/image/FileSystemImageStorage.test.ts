import {
  FileSystemImageStorage,
  FileSystemPort,
} from '../../../../src/services/image/FileSystemImageStorage';

/** In-memory fake of the file-system port. */
const createFakeFs = (initial: string[] = []) => {
  const files = new Set(initial);
  const fs: jest.Mocked<FileSystemPort> = {
    exists: jest.fn(async (path: string) => files.has(path)),
    mkdir: jest.fn(async (path: string) => {
      files.add(path);
    }),
    copyFile: jest.fn(async (_from: string, to: string) => {
      files.add(to);
    }),
    unlink: jest.fn(async (path: string) => {
      files.delete(path);
    }),
  };
  return { fs, files };
};

describe('FileSystemImageStorage', () => {
  it('creates the folder and stores the image with a unique name', async () => {
    const { fs, files } = createFakeFs();
    const storage = new FileSystemImageStorage(
      fs,
      () => '/base',
      () => 'uuid-1',
    );

    const uri = await storage.save(
      { uri: 'file:///tmp/My%20Photo.png', mimeType: 'image/png' },
      'imgs',
      'P/01',
    );

    expect(fs.mkdir).toHaveBeenCalledWith('/base/imgs');
    // Source path is decoded and stripped of the scheme for RNFS.
    expect(fs.copyFile).toHaveBeenCalledWith(
      '/tmp/My Photo.png',
      '/base/imgs/P_01_uuid-1.png',
    );
    expect(uri).toBe('file:///base/imgs/P_01_uuid-1.png');
    expect(files.has('/base/imgs/P_01_uuid-1.png')).toBe(true);
  });

  it('does not recreate an existing folder', async () => {
    const { fs } = createFakeFs(['/base/imgs']);
    const storage = new FileSystemImageStorage(
      fs,
      () => '/base',
      () => 'id',
    );
    await storage.save({ uri: 'file:///tmp/a.jpg' }, 'imgs', 'A');
    expect(fs.mkdir).not.toHaveBeenCalled();
  });

  it('removes existing files and ignores missing ones', async () => {
    const { fs, files } = createFakeFs(['/base/imgs/A.jpg']);
    const storage = new FileSystemImageStorage(fs, () => '/base');

    await storage.remove('file:///base/imgs/A.jpg');
    expect(files.has('/base/imgs/A.jpg')).toBe(false);

    await storage.remove('file:///base/imgs/missing.jpg');
    await storage.remove('');
    expect(fs.unlink).toHaveBeenCalledTimes(1);
  });
});
