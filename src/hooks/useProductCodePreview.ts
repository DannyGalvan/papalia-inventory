import { useCallback, useEffect, useRef, useState } from 'react';

/** Anything able to tell which code the next product will receive. */
export interface ProductCodePreviewer {
  previewNextCode(): Promise<string>;
}

/**
 * Loads the code the next product will receive, for display in the create
 * form. Falls back to '' (the code is still generated on save). Only the
 * first load reports `isLoading`; `refresh` updates the code silently.
 */
export const useProductCodePreview = (previewer: ProductCodePreviewer) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    let next = '';
    try {
      next = await previewer.previewNextCode();
    } catch {
      next = '';
    }
    if (mounted.current) {
      setCode(next);
      setIsLoading(false);
    }
  }, [previewer]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  return { code, isLoading, refresh };
};
