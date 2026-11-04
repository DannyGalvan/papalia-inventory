import { useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

/**
 * Image-folder configuration (Configuración screen).
 * Taking / picking photos lives in {@link useProductImage}.
 */
export const useImages = () => {
  const { dirImages, changeDirImages, isLoading } = useContext(ProductContext);

  return {
    dirImages,
    changeDirImages,
    isLoading,
  };
};
