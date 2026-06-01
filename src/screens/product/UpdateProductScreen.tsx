import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ProductForm } from '../../components/form/ProductForm';
import { Product } from '../../database/models/Product';
import {
    getProductById,
    updateProduct,
} from '../../database/repository/ProductRepository';
import { useTheme } from '../../hooks/useTheme';
import { ProductEditScreenProps } from '../../interfaces/IProductNavigation';

export const UpdateProductScreen = ({
  navigation,
  route,
}: ProductEditScreenProps) => {
  const {theme} = useTheme();
  const {id} = route.params;
  const [productState, setProductState] = useState<Product>(new Product());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const product = await getProductById(id);
      setProductState(product);
      setIsLoading(false);
    })();
  }, [id]);

  const onSubmit = async (product: Product) => {
    const response = await updateProduct(product);

    if (response.success) {
      navigation.navigate('ListProduct');
    } else {
      Alert.alert('Error al actualizar el producto', response.message);
    }

    return response;
  };

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <Text
        style={[styles.title, {color: theme.colors.text}]}
        accessibilityRole="header">
        Actualizar Producto
      </Text>
      {!isLoading && (
        <ProductForm initialForm={productState} onSubmit={onSubmit} update />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
