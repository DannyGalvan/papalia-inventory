import React, {useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {appStyles} from '../../styles/globalStyles';
import {ProductForm} from '../../components/form/ProductForm';
import {ProductEditScreenProps} from '../../interfaces/IProductNavigation';
import {
  getProductById,
  updateProduct,
} from '../../database/repository/ProductRepository';
import {Product} from '../../database/models/Product';

export const UpdateProductScreen = ({
  navigation,
  route,
}: ProductEditScreenProps) => {
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
    <View style={[styles.container, appStyles.screen]}>
      <ScrollView>
        <Text
          style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
          Actualizar Producto
        </Text>
        {!isLoading && (
          <ProductForm initialForm={productState} onSubmit={onSubmit} update />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
