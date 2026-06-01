import { pick, types } from '@react-native-documents/picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Fab } from '../../components/button/Fab';
import { ProductForm } from '../../components/form/ProductForm';
import { Product } from '../../database/models/Product';
import {
  ProductRepository,
  createProduct,
} from '../../database/repository/ProductRepository';
import { useTheme } from '../../hooks/useTheme';
import { ProductCreateScreenProps } from '../../interfaces/IProductNavigation';
import { excelService } from '../../services/ExcelService';
import { appColors } from '../../styles/globalStyles';

const initialForm = ProductRepository.create({
  code: '',
  name: '',
  description: '',
  price: 0.0,
  stock: 0,
  image: '',
});

export const CreateProductScreen = ({
  navigation,
}: ProductCreateScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const {theme} = useTheme();

  const onSubmit = async (product: Product) => {
    const response = await createProduct(product);

    if (response.success) {
      navigation.navigate('ListProduct');
    } else {
      Alert.alert('Error al crear el producto', response.message);
    }

    return response;
  };

  const uploadFile = async () => {
    try {
      setIsLoading(true);

      const response = await pick({
        // On iOS these are UTIs; on Android they match MIME types.
        type: [types.xls, types.xlsx],
      });

      const res = response[0];

      // importProducts normalises file:// and content:// URIs internally.
      const data = await excelService.importProducts(res.uri);

      if (data.length === 0) {
        Alert.alert(
          'Archivo vacío',
          'El archivo no contiene productos o el formato no es compatible.',
        );
        setIsLoading(false);
        return;
      }

      for (const product of data) {
        const result = await createProduct(product);
        if (!result.success) {
          Alert.alert(
            'Error al importar',
            `No se pudo guardar el producto "${product.name}": ${result.message}`,
          );
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
      Alert.alert(
        'Importación exitosa',
        `Se importaron ${data.length} producto${data.length !== 1 ? 's' : ''} correctamente.`,
      );
    } catch (error: unknown) {
      setIsLoading(false);
      // User dismissed the picker — no error dialog needed.
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        (error as {code: string}).code === 'OPERATION_CANCELED'
      ) {
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al leer el archivo.';
      Alert.alert('Error al importar', message);
    }
  };

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <Text
        style={[styles.title, {color: theme.colors.text}]}
        accessibilityRole="header">
        Crear Nuevo Producto
      </Text>
      <ProductForm initialForm={initialForm} onSubmit={onSubmit} />
      <Fab
        style={styles.fabR}
        iconName="document-attach-outline"
        onPress={uploadFile}
        isLoading={isLoading}
        accessibilityLabel="Importar productos desde Excel"
        accessibilityHint="Selecciona un archivo Excel para importar productos"
      />
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
  fabR: {
    bottom: 20,
    right: 20,
    position: 'absolute',
    backgroundColor: appColors.success,
  },
});
