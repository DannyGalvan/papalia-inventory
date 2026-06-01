import React from 'react';
import { DimensionValue, Image, StyleSheet, Text, View } from 'react-native';
import { LogDetail } from '../database/models/LogDetail';
import { appColors, appStyles } from '../styles/globalStyles';
import { TouchableButton } from './button/TouchableButton';

interface Props {
  detail: LogDetail;
  removeDetail: (id: number) => void;
  updateDetail: (item: LogDetail, idx: number) => void;
  index: number;
  readonly?: boolean;
}

export const DetailsItem = ({
  detail,
  removeDetail,
  updateDetail,
  index,
  readonly,
}: Props) => {
  const noImage = require('../assets/sin_imagen.png');
  const imageAccessibilityLabel = `Imagen del producto ${detail.product.name}`;
  return (
    <View
      style={[appStyles.bgGray, styles.container]}
      accessible={false}
      accessibilityLabel={`Detalle de producto ${detail.product.name}, cantidad ${detail.quantity}, precio Q${detail.product.price}`}
    >
      <View
        style={[appStyles.flexRow, appStyles.justifyBetween, styles.details]}
      >
        <Text
          style={[appStyles.textDark, appStyles.subTitle, styles.itemControls]}
        >
          {detail.product.name} - Q{detail.product.price}
        </Text>
        <View style={[appStyles.flexRow, appStyles.alignCenter]}>
          {!readonly && (
            <TouchableButton
              onPress={() => {
                detail.quantity = detail.quantity + 1;
                detail.total = detail.quantity * detail.price;
                updateDetail(detail, index);
              }}
              icon="add"
              iconColor={appColors.white}
              textStyle={[appStyles.subTitle]}
              styles={styles.button}
              iconSize={20}
              accessibilityLabel={`Aumentar cantidad de ${detail.product.name}`}
              accessibilityHint="Aumenta la cantidad en uno"
            />
          )}
          <Text
            style={[appStyles.textDark, appStyles.subTitle, styles.quantity]}
          >
            {detail.quantity}
          </Text>
          {!readonly && (
            <TouchableButton
              onPress={() => {
                if (detail.quantity > 1) {
                  detail.quantity = detail.quantity - 1;
                  detail.total = detail.quantity * detail.price;
                  updateDetail(detail, index);
                }
              }}
              icon="remove"
              iconColor={appColors.white}
              textStyle={[appStyles.subTitle]}
              styles={styles.button}
              iconSize={20}
              accessibilityLabel={`Disminuir cantidad de ${detail.product.name}`}
              accessibilityHint="Disminuye la cantidad en uno"
            />
          )}
        </View>
      </View>
      <Image
        style={styles.image}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={imageAccessibilityLabel}
        source={
          detail.product.image
            ? {
                uri: detail.product.image,
              }
            : noImage
        }
      />
      {!readonly && (
        <TouchableButton
          onPress={() => removeDetail(detail.id)}
          icon="trash"
          iconColor={appColors.danger}
          textStyle={[appStyles.subTitle]}
          styles={styles.bf}
          iconSize={20}
          accessibilityLabel={`Eliminar ${detail.product.name} de la lista`}
          accessibilityHint="Elimina este producto del movimiento"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    minHeight: 100,
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 10,
    paddingVertical: 15,
  },
  details: {
    marginVertical: 10,
  },
  bf: {
    position: 'absolute',
    right: 5,
    top: 0,
    width: 25,
  },
  button: {
    backgroundColor: appColors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  quantity: {
    width: 50,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: appColors.primary,
    borderRadius: 10,
    marginHorizontal: 5,
    paddingVertical: 3,
  },
  itemControls: {
    width: '50%',
  },
  image: {
    width: '100%' as DimensionValue,
    height: 100,
    resizeMode: 'contain',
  },
});
