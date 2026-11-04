import { ImagePickerError } from '../../../../src/services/image/ImagePickerError';
import { mapPickerResponse } from '../../../../src/services/image/mapPickerResponse';

describe('mapPickerResponse', () => {
  it('returns null when the user cancels', () => {
    expect(mapPickerResponse({ didCancel: true })).toBeNull();
  });

  it('returns null when no asset has a uri', () => {
    expect(mapPickerResponse({ assets: [] })).toBeNull();
    expect(mapPickerResponse({ assets: [{ fileName: 'a.jpg' }] })).toBeNull();
    expect(mapPickerResponse({})).toBeNull();
  });

  it('maps the first asset', () => {
    expect(
      mapPickerResponse({
        assets: [
          { uri: 'file:///tmp/a.jpg', type: 'image/jpeg', fileName: 'a.jpg' },
          { uri: 'file:///tmp/b.jpg' },
        ],
      }),
    ).toEqual({
      uri: 'file:///tmp/a.jpg',
      mimeType: 'image/jpeg',
      fileName: 'a.jpg',
    });
  });

  it.each([
    ['camera_unavailable', 'camera_unavailable'],
    ['permission', 'permission'],
    ['others', 'unknown'],
  ] as const)('maps native error %s to %s', (nativeCode, expected) => {
    try {
      mapPickerResponse({ errorCode: nativeCode, errorMessage: 'boom' });
      throw new Error('expected to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ImagePickerError);
      expect((error as ImagePickerError).code).toBe(expected);
      expect((error as ImagePickerError).message).toBe('boom');
      expect((error as ImagePickerError).userMessage.length).toBeGreaterThan(0);
    }
  });
});
