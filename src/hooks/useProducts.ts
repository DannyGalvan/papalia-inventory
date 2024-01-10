import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {
  getAllProducts,
  getTotalProducts,
  searchProductsByCodeOrName,
} from '../database/repository/ProductRepository';
import {Product} from '../database/models/Product';
import {Alert} from 'react-native';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    (async () => {
      try {
        setIsLoading(true);
        const data = getAllProducts();
        const totalProducts = getTotalProducts();
        setTotal(await totalProducts);
        setProducts(await data);
        setIsLoading(false);
      } catch (error) {
        Alert.alert('Error al cargar productos', error.message);
        setIsLoading(false);
      }
    })();
  };

  useFocusEffect(useCallback(loadData, []));

  const searchProducts = async (search: string) => {
    try {
      setIsLoading(true);
      const data = await searchProductsByCodeOrName(search);
      setProducts(data);
      setIsLoading(false);
    } catch (error) {
      Alert.alert('Error al realizar busqueda', error.message);
      setIsLoading(false);
      return [];
    }
  };

  return {products, total, loadData, isLoading, searchProducts};
};
