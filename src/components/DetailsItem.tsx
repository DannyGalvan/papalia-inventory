import React from 'react';
import {appColors, appStyles} from '../styles/globalStyles';
import {DimensionValue, Image, StyleSheet, Text, View} from 'react-native';
import {TouchableButton} from './button/TouchableButton';
import {LogDetail} from '../database/models/LogDetail';

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
  return (
    <View style={[appStyles.bgGray, styles.container]}>
      <View
        style={[appStyles.flexRow, appStyles.justifyBetween, styles.details]}>
        <Text
          style={[appStyles.textDark, appStyles.subTitle, styles.itemControls]}>
          {detail.product.name} - Q{detail.product.price.toFixed(2)}
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
            />
          )}
          <Text
            style={[appStyles.textDark, appStyles.subTitle, styles.quantity]}>
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
            />
          )}
        </View>
      </View>
      <Image
        style={styles.image}
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
    height: 175,
    resizeMode: 'contain',
  },
});
