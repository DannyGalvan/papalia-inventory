import React, {useCallback} from 'react';
import {
  DimensionValue,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {appStyles} from '../styles/globalStyles';
import {Product} from '../database/models/Product';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {ProductStackParamList} from '../interfaces/IProductNavigation';

export const ProductItem = ({product}: {product: Product}) => {
  const noImage = require('../assets/sin_imagen.png');
  const {navigate} = useNavigation<NavigationProp<ProductStackParamList>>();

  const nonExistentProduct = product.stock === 0;

  const containerStyle = [
    appStyles.flexColumn,
    !nonExistentProduct ? appStyles.bgPrimary : appStyles.bgDanger,
    styles.container,
    appStyles.justifyCenter,
  ];

  const onPress = useCallback(() => {
    navigate('EditProduct', {id: product.code});
  }, [navigate, product.code]);

  return (
    <TouchableOpacity
      style={containerStyle}
      activeOpacity={0.7}
      onPress={onPress}>
      <View style={[appStyles.flexRow, appStyles.justifyBetween]}>
        <View style={styles.code}>
          <Text
            style={[appStyles.text, appStyles.textWhite, appStyles.subTitle]}>
            Codigo
          </Text>
        </View>
        <View style={styles.description}>
          <Text
            style={[
              appStyles.text,
              appStyles.textWhite,
              appStyles.textCenter,
              appStyles.subTitle,
            ]}>
            Nombre
          </Text>
        </View>
      </View>
      <View style={[appStyles.flexRow, appStyles.justifyBetween]}>
        <View style={styles.code}>
          <Text style={[appStyles.text, appStyles.textWhite]}>
            {product.code}
          </Text>
        </View>
        <View style={styles.description}>
          <Text style={[appStyles.text, appStyles.textWhite]}>
            {product.name}
          </Text>
        </View>
      </View>
      <View style={[appStyles.flexColumn, styles.remark]}>
        <View>
          <Text
            style={[
              appStyles.subTitle,
              appStyles.textWhite,
              appStyles.textCenter,
            ]}>
            Descripción
          </Text>
        </View>
        <View>
          <Text style={[appStyles.text, appStyles.textWhite]}>
            {product.description}
          </Text>
        </View>
        <Image
          style={styles.image}
          source={
            product.image
              ? {
                  uri: product.image,
                }
              : noImage
          }
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 5,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    minHeight: 80,
  },
  code: {
    width: '40%' as DimensionValue,
  },
  description: {
    width: '60%' as DimensionValue,
  },
  remark: {
    width: '100%' as DimensionValue,
    marginVertical: 10,
  },
  image: {
    width: '100%' as DimensionValue,
    height: 200,
    marginVertical: 10,
    resizeMode: 'contain',
  },
});
