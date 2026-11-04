import React from 'react';
import { Alert } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('../../../src/services/image/createProductImageService', () => ({
  createProductImageService: jest.fn(),
}));
jest.mock('../../../src/hooks/useStoragePermissions', () => ({
  useStoragePermissions: () => ({ checkStoragePermissions: jest.fn() }),
}));
jest.mock('../../../src/services/LogService', () => ({
  logService: { logError: jest.fn() },
}));
jest.mock('../../../src/context/ProductContext', () => {
  const ReactLib = require('react');
  return { ProductContext: ReactLib.createContext({ dirImages: 'imgs' }) };
});

import { useProductImage } from '../../../src/hooks/useProductImage';
import { ImagePickerError } from '../../../src/services/image/ImagePickerError';
import {
  AcquireImageRequest,
  ProductImageService,
} from '../../../src/services/image/ProductImageService';
import { logService } from '../../../src/services/LogService';

type HookResult = ReturnType<typeof useProductImage>;

const renderHook = (service: ProductImageService) => {
  const ref: { current: HookResult | null } = { current: null };
  const Harness = () => {
    ref.current = useProductImage(service);
    return null;
  };
  act(() => {
    TestRenderer.create(<Harness />);
  });
  return ref;
};

const fakeService = (acquire: jest.Mock) =>
  ({
    acquire,
    discard: jest.fn(async () => {}),
  } as unknown as ProductImageService);

const params = {
  source: 'camera' as const,
  productCode: 'A1',
  currentImage: '',
  persistedImage: '',
};

describe('useProductImage', () => {
  let alertSpy: jest.SpyInstance;
  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.clearAllMocks();
  });
  afterEach(() => alertSpy.mockRestore());

  it('passes the configured folder and returns the stored uri', async () => {
    const acquire = jest.fn(async () => 'file:///new.jpg');
    const hook = renderHook(fakeService(acquire));
    let uri: string | null = null;
    await act(async () => {
      uri = await hook.current!.acquireImage(params);
    });
    expect(uri).toBe('file:///new.jpg');
    expect(acquire).toHaveBeenCalledWith({
      source: 'camera',
      productCode: 'A1',
      directory: 'imgs',
      discardUri: undefined,
    });
    expect(hook.current!.isProcessing).toBe(false);
  });

  it('discards only an unsaved current image', async () => {
    const acquire = jest.fn(
      async (_request: AcquireImageRequest) => 'file:///n.jpg',
    );
    const hook = renderHook(fakeService(acquire));
    await act(async () => {
      await hook.current!.acquireImage({
        ...params,
        currentImage: 'file:///saved.jpg',
        persistedImage: 'file:///saved.jpg',
      });
    });
    expect(acquire.mock.calls[0][0].discardUri).toBeUndefined();

    await act(async () => {
      await hook.current!.acquireImage({
        ...params,
        currentImage: 'file:///draft.jpg',
        persistedImage: 'file:///saved.jpg',
      });
    });
    expect(acquire.mock.calls[1][0].discardUri).toBe('file:///draft.jpg');
  });

  it('shows the domain message and logs on known errors', async () => {
    const acquire = jest.fn(async () => {
      throw new ImagePickerError('camera_unavailable');
    });
    const hook = renderHook(fakeService(acquire));
    let uri: string | null = 'x';
    await act(async () => {
      uri = await hook.current!.acquireImage(params);
    });
    expect(uri).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith(
      'Imagen del producto',
      'La cámara no está disponible en este dispositivo.',
    );
    expect(logService.logError).toHaveBeenCalled();
  });

  it('shows a generic message on unexpected errors', async () => {
    const acquire = jest.fn(async () => {
      throw new Error('boom');
    });
    const hook = renderHook(fakeService(acquire));
    await act(async () => {
      await hook.current!.acquireImage(params);
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Error al subir la imagen',
      expect.any(String),
    );
  });

  it('ignores a second request while one is in flight', async () => {
    let resolve!: (v: string) => void;
    const acquire = jest.fn(() => new Promise<string>(r => (resolve = r)));
    const hook = renderHook(fakeService(acquire));
    let first!: Promise<string | null>;
    let second: string | null = 'x';
    await act(async () => {
      first = hook.current!.acquireImage(params);
      second = await hook.current!.acquireImage(params);
    });
    expect(second).toBeNull();
    expect(acquire).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve('file:///a.jpg');
      await first;
    });
  });
});
