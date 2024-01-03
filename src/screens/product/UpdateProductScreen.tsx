import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
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
      console.log(product, 'product');
      setIsLoading(false);
    })();
  }, [id]);

  const onSubmit = async (product: Product) => {
    const response = await updateProduct(product);

    if (response.success) {
      navigation.navigate('ListProduct');
    }

    return response;
  };

  return (
    <ScrollView style={styles.container}>
      <View>
        <Text
          style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
          Actualizar Producto
        </Text>
        {!isLoading && (
          <ProductForm initialForm={productState} onSubmit={onSubmit} update />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
});