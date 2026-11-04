import { ImagePickerError } from '../../../../src/services/image/ImagePickerError';
import { PickerImageSource } from '../../../../src/services/image/PickerImageSource';
import { ProductImageService } from '../../../../src/services/image/ProductImageService';
import {
  ImageSource,
  ImageStorage,
  PickedImage,
  StorageAccessGate,
} from '../../../../src/services/image/types';

const PICKED: PickedImage = {
  uri: 'file:///tmp/p.jpg',
  mimeType: 'image/jpeg',
};

const setup = (
  overrides: {
    picked?: PickedImage | null;
    access?: boolean;
    saveError?: Error;
    removeError?: Error;
  } = {},
) => {
  const camera: jest.Mocked<ImageSource> = {
    pick: jest.fn(async () =>
      overrides.picked === undefined ? PICKED : overrides.picked,
    ),
  };
  const library: jest.Mocked<ImageSource> = {
    pick: jest.fn(async () => PICKED),
  };
  const storage: jest.Mocked<ImageStorage> = {
    save: jest.fn(async (_image: PickedImage, _dir: string, _name: string) => {
      if (overrides.saveError) {
        throw overrides.saveError;
      }
      return 'file:///store/new.jpg';
    }),
    remove: jest.fn(async (_uri: string) => {
      if (overrides.removeError) {
        throw overrides.removeError;
      }
    }),
  };
  const gate: jest.Mocked<StorageAccessGate> = {
    ensureAccess: jest.fn(async () => overrides.access ?? true),
  };
  const service = new ProductImageService({ camera, library }, storage, gate);
  return { service, camera, library, storage, gate };
};

const request = {
  source: 'camera' as const,
  productCode: 'A-1',
  directory: 'imgs',
};

describe('ProductImageService.acquire', () => {
  it('uses the requested source and stores the image', async () => {
    const { service, camera, library, storage } = setup();
    await expect(service.acquire(request)).resolves.toBe(
      'file:///store/new.jpg',
    );
    expect(camera.pick).toHaveBeenCalledTimes(1);
    expect(library.pick).not.toHaveBeenCalled();
    expect(storage.save).toHaveBeenCalledWith(PICKED, 'imgs', 'A-1');
  });

  it('routes to the gallery source', async () => {
    const { service, camera, library } = setup();
    await service.acquire({ ...request, source: 'library' });
    expect(library.pick).toHaveBeenCalledTimes(1);
    expect(camera.pick).not.toHaveBeenCalled();
  });

  it('requires a product code before opening any source', async () => {
    const { service, camera } = setup();
    await expect(
      service.acquire({ ...request, productCode: '  ' }),
    ).rejects.toMatchObject({ code: 'missing_code' });
    expect(camera.pick).not.toHaveBeenCalled();
  });

  it('fails with storage_permission when access is denied', async () => {
    const { service, camera } = setup({ access: false });
    await expect(service.acquire(request)).rejects.toBeInstanceOf(
      ImagePickerError,
    );
    await expect(service.acquire(request)).rejects.toMatchObject({
      code: 'storage_permission',
    });
    expect(camera.pick).not.toHaveBeenCalled();
  });

  it('returns null and stores nothing when the user cancels', async () => {
    const { service, storage } = setup({ picked: null });
    await expect(
      service.acquire({ ...request, discardUri: 'file:///old.jpg' }),
    ).resolves.toBeNull();
    expect(storage.save).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('discards the unsaved previous image only after a successful save', async () => {
    const { service, storage } = setup();
    await service.acquire({ ...request, discardUri: 'file:///old.jpg' });
    expect(storage.remove).toHaveBeenCalledWith('file:///old.jpg');
    expect(storage.save.mock.invocationCallOrder[0]).toBeLessThan(
      storage.remove.mock.invocationCallOrder[0],
    );
  });

  it('keeps the previous image when saving fails', async () => {
    const { service, storage } = setup({ saveError: new Error('disk full') });
    await expect(
      service.acquire({ ...request, discardUri: 'file:///old.jpg' }),
    ).rejects.toThrow('disk full');
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('never fails because cleanup failed', async () => {
    const { service } = setup({ removeError: new Error('locked') });
    await expect(
      service.acquire({ ...request, discardUri: 'file:///old.jpg' }),
    ).resolves.toBe('file:///store/new.jpg');
    await expect(service.discard('file:///x.jpg')).resolves.toBeUndefined();
  });
});

describe('PickerImageSource', () => {
  it('passes its options to the launcher and maps the response', async () => {
    const launch = jest.fn(async () => ({
      assets: [{ uri: 'file:///tmp/c.jpg', type: 'image/jpeg' }],
    }));
    const options = { mediaType: 'photo' as const, maxWidth: 100 };
    const source = new PickerImageSource(launch, options);

    await expect(source.pick()).resolves.toEqual({
      uri: 'file:///tmp/c.jpg',
      mimeType: 'image/jpeg',
      fileName: undefined,
    });
    expect(launch).toHaveBeenCalledWith(options);
  });

  it('propagates native errors as ImagePickerError', async () => {
    const source = new PickerImageSource(
      async () => ({ errorCode: 'camera_unavailable' as const }),
      { mediaType: 'photo' as const },
    );
    await expect(source.pick()).rejects.toMatchObject({
      code: 'camera_unavailable',
    });
  });
});
