import fc from 'fast-check';
import {
  resolveImageExtension,
  sanitizeFileBaseName,
} from '../../../../src/services/image/imageExtension';

describe('resolveImageExtension', () => {
  it('prefers a known MIME type', () => {
    expect(
      resolveImageExtension({
        uri: 'x',
        mimeType: 'image/png',
        fileName: 'a.jpg',
      }),
    ).toBe('png');
    expect(resolveImageExtension({ uri: 'x', mimeType: 'IMAGE/JPEG' })).toBe(
      'jpg',
    );
    expect(resolveImageExtension({ uri: 'x', mimeType: 'image/heic' })).toBe(
      'heic',
    );
  });

  it('falls back to the file-name extension', () => {
    expect(
      resolveImageExtension({
        uri: 'x',
        mimeType: 'weird',
        fileName: 'p.JPEG',
      }),
    ).toBe('jpg');
    expect(resolveImageExtension({ uri: 'x', fileName: 'p.webp' })).toBe(
      'webp',
    );
  });

  it('defaults to jpg for unknown or unsafe input', () => {
    expect(resolveImageExtension({ uri: 'x' })).toBe('jpg');
    expect(resolveImageExtension({ uri: 'x', fileName: 'noext' })).toBe('jpg');
    expect(resolveImageExtension({ uri: 'x', fileName: 'a.../../etc' })).toBe(
      'jpg',
    );
  });

  it('ignores prototype keys as MIME types', () => {
    expect(resolveImageExtension({ uri: 'x', mimeType: '__proto__' })).toBe(
      'jpg',
    );
    expect(resolveImageExtension({ uri: 'x', mimeType: 'constructor' })).toBe(
      'jpg',
    );
  });

  it('always yields a short alphanumeric extension', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: undefined }),
        fc.option(fc.string(), { nil: undefined }),
        (mimeType, fileName) => {
          const ext = resolveImageExtension({ uri: 'x', mimeType, fileName });
          expect(ext).toMatch(/^[a-z0-9]{2,5}$/);
        },
      ),
      { numRuns: 500 },
    );
  });
});

describe('sanitizeFileBaseName', () => {
  it('replaces unsafe characters', () => {
    expect(sanitizeFileBaseName(' A/B C?1 ')).toBe('A_B_C_1');
    expect(sanitizeFileBaseName('café-01')).toBe('caf_-01');
  });

  it('never returns an empty or path-like name', () => {
    fc.assert(
      fc.property(fc.string(), value => {
        const result = sanitizeFileBaseName(value);
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(64);
        expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
      }),
    );
  });
});
