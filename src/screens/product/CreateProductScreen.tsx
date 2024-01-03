import React, {useState} from 'react';
import Picker from 'react-native-document-picker';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {appColors, appStyles} from '../../styles/globalStyles';
import {ProductForm} from '../../components/form/ProductForm';
import {ProductCreateScreenProps} from '../../interfaces/IProductNavigation';
import {
  ProductRepository,
  createProduct,
} from '../../database/repository/ProductRepository';
import {Product} from '../../database/models/Product';
import {Fab} from '../../components/button/Fab';
import {readFile} from '@dr.pogodin/react-native-fs';
import {read, utils} from 'xlsx';

const initialForm = ProductRepository.create({
  code: '',
  name: '',
  description: '',
  price: 0.0,
  stock: 0,
});

export const CreateProductScreen = ({navigation}: ProductCreateScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (product: Product) => {
    const response = await createProduct(product);

    if (response.success) {
      navigation.navigate('ListProduct');
    }

    return response;
  };

  const uploadFile = async () => {
    try {
      setIsLoading(true);
      const res = await Picker.pickSingle({
        type: [Picker.types.xls, Picker.types.xlsx],
      });

      const file = await readFile(res.uri, 'ascii');
      const wb = read(file, {type: 'binary'});
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = utils.sheet_to_json<Product>(ws);

      await Promise.all(data.map(item => createProduct(item)));
      setIsLoading(false);

      Alert.alert(
        'Archivo cargado con éxito',
        `Se cargaron ${data.length} productos, lista actualizada`,
      );
    } catch (error) {
      if (Picker.isCancel(error)) {
        Alert.alert('Se Cancelo la subida del archivo', error.message);
      } else {
        Alert.alert('Error al subir el archivo', error.message);
      }
      setIsLoading(false);
    }
  };

  return (
    <View style={[appStyles.screen]}>
      <ScrollView style={styles.container}>
        <View>
          <Text
            style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
            Crear Nuevo Producto
          </Text>
          <ProductForm initialForm={initialForm} onSubmit={onSubmit} />
        </View>
      </ScrollView>
      <Fab
        style={styles.fabR}
        iconName="document-attach-outline"
        onPress={uploadFile}
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  fabR: {
    bottom: 20,
    right: 20,
    position: 'absolute' as 'absolute',
    backgroundColor: appColors.success,
  },
});
