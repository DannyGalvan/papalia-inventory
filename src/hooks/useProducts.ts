import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {
  getAllProducts,
  getTotalProducts,
  searchProductsByCodeOrName,
} from '../database/repository/ProductRepository';
import {Product} from '../database/models/Product';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    (async () => {
      setIsLoading(true);
      const data = getAllProducts();
      const totalProducts = getTotalProducts();
      setTotal(await totalProducts);
      setProducts(await data);
      setIsLoading(false);
    })();
  };

  useFocusEffect(useCallback(loadData, []));

  const searchProducts = async (search: string) => {
    try {
      const data = await searchProductsByCodeOrName(search);
      setProducts(data);
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  return {products, total, loadData, isLoading, searchProducts};
};
