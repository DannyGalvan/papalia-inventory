import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  ProductCodePreviewer,
  useProductCodePreview,
} from '../../../src/hooks/useProductCodePreview';

type HookResult = ReturnType<typeof useProductCodePreview>;

const render = (previewer: ProductCodePreviewer) => {
  const ref: { current: HookResult | null } = { current: null };
  const Harness = () => {
    ref.current = useProductCodePreview(previewer);
    return null;
  };
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(<Harness />);
  });
  return { ref, renderer: renderer! };
};

const flush = () => act(async () => {});

describe('useProductCodePreview', () => {
  it('loads the next code', async () => {
    const previewer = { previewNextCode: jest.fn(async () => 'PRD-000004') };
    const { ref } = render(previewer);
    expect(ref.current?.isLoading).toBe(true);

    await flush();

    expect(ref.current).toMatchObject({ code: 'PRD-000004', isLoading: false });
  });

  it('falls back to an empty code on errors', async () => {
    const previewer = {
      previewNextCode: jest.fn(async () => {
        throw new Error('db');
      }),
    };
    const { ref } = render(previewer);
    await flush();
    expect(ref.current).toMatchObject({ code: '', isLoading: false });
  });

  it('refresh updates the code without showing the loading state', async () => {
    const previewer = {
      previewNextCode: jest
        .fn()
        .mockResolvedValueOnce('PRD-000001')
        .mockResolvedValueOnce('PRD-000009'),
    };
    const { ref } = render(previewer);
    await flush();

    let pending: Promise<void> | undefined;
    act(() => {
      pending = ref.current?.refresh();
    });
    expect(ref.current?.isLoading).toBe(false);
    await act(async () => {
      await pending;
    });
    expect(ref.current?.code).toBe('PRD-000009');
  });

  it('ignores results that arrive after unmount', async () => {
    let resolve: (code: string) => void = () => {};
    const previewer = {
      previewNextCode: jest.fn(() => new Promise<string>(r => (resolve = r))),
    };
    const { ref, renderer } = render(previewer);
    act(() => renderer.unmount());
    await act(async () => resolve('PRD-000001'));
    expect(ref.current?.code).toBe('');
  });
});
