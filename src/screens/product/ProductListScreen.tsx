import React, {useState} from 'react';
import {Alert, FlatList, Text, View} from 'react-native';
import {DownloadDirectoryPath, writeFile} from '@dr.pogodin/react-native-fs';
import {appColors, appStyles} from '../../styles/globalStyles';
import {ProductItem} from '../../components/ProductItem';
import {useProducts} from '../../hooks/useProducts';
import {InputSearch} from '../../components/input/InputSearch';
import {Fab} from '../../components/button/Fab';
import {ProductListScreenProps} from '../../interfaces/IProductNavigation';
import {getFullProducts} from '../../database/repository/ProductRepository';
import {utils, write} from 'xlsx';

export const ProductListScreen = ({navigation}: ProductListScreenProps) => {
  const {products, total, loadData, isLoading, searchProducts} = useProducts();
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);

  const downloadFile = async () => {
    try {
      setIsLoadingDownload(true);
      const data = await getFullProducts();
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Productos');
      const wbout = write(wb, {type: 'binary', bookType: 'xlsx'});
      const fileSave = `${DownloadDirectoryPath}/Productos.xlsx`;
      await writeFile(fileSave, wbout, 'ascii');
      Alert.alert('Archivo guardado en descargas', fileSave);
      setIsLoadingDownload(false);
    } catch (e) {
      Alert.alert('Error al descargar el archivo', e.message);
      setIsLoadingDownload(false);
    }
  };

  return (
    <View style={[appStyles.screen]}>
      <Text style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
        Lista de productos
      </Text>
      <View>
        <Text
          style={[appStyles.text, appStyles.textDark, appStyles.textCenter]}>
          Total de productos: {total}
        </Text>
      </View>
      <InputSearch updateFn={searchProducts} />
      <FlatList
        style={[styles.list]}
        data={products}
        renderItem={({item}) => <ProductItem product={item} />}
        refreshing={isLoading}
        onRefresh={loadData}
        keyExtractor={item => item.code}
      />
      <Fab
        style={styles.fabR}
        iconName="add"
        onPress={() => navigation.navigate('CreateProduct')}
      />
      <Fab
        style={styles.fabL}
        iconName="download"
        onPress={downloadFile}
        isLoading={isLoadingDownload}
      />
    </View>
  );
};

const styles = {
  list: {
    padding: 10,
  },
  fabR: {
    bottom: 20,
    right: 20,
    position: 'absolute' as 'absolute',
  },
  fabL: {
    bottom: 20,
    left: 20,
    position: 'absolute' as 'absolute',
    backgroundColor: appColors.success,
  },
};
