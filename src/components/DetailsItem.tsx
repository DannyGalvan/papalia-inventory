import React, { useState } from 'react';
import {
  DimensionValue,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LogDetail } from '../database/models/LogDetail';
import { appColors, appStyles } from '../styles/globalStyles';
import { TouchableButton } from './button/TouchableButton';
import { resolveImageUri } from '../utils/filePaths';
import { formatCurrency } from '../utils/formatCurrency';
import { formatPct } from '../utils/profit';
import {
  isBelowCost,
  parsePriceInput,
  priceAdjustmentPct,
} from '../utils/salePrice';

// Darker tones than appColors.success/warning for readable text on gray.
const PRICE_UP_COLOR = '#2E7D32';
const BELOW_COST_COLOR = '#B45309';

interface Props {
  detail: LogDetail;
  removeDetail: (id: number) => void;
  updateDetail: (item: LogDetail, idx: number) => void;
  index: number;
  readonly?: boolean;
  /** Allow overriding the unit price (sales/outputs only). */
  editablePrice?: boolean;
  currencySymbol?: string;
}

export const DetailsItem = ({
  detail,
  removeDetail,
  updateDetail,
  index,
  readonly,
  editablePrice = false,
  currencySymbol = 'Q',
}: Props) => {
  const noImage = require('../assets/sin_imagen.png');
  const listPrice = Number(detail.product?.price) || 0;
  const [priceText, setPriceText] = useState(() =>
    String(Number(detail.price) || 0),
  );
  const [priceError, setPriceError] = useState('');

  const salePrice = Number(detail.price);
  const adjustment = Number.isFinite(salePrice)
    ? priceAdjustmentPct(listPrice, salePrice)
    : null;
  const belowCost =
    Number.isFinite(salePrice) &&
    isBelowCost(salePrice, Number(detail.unitCost));
  const money = (value: number) => formatCurrency(value, currencySymbol);

  const applyPrice = (price: number) => {
    detail.price = price;
    detail.total = detail.quantity * price;
    updateDetail(detail, index);
  };

  const onChangePrice = (text: string) => {
    setPriceText(text);
    const parsed = parsePriceInput(text);
    if (parsed === null) {
      setPriceError('Ingresa un precio válido (mayor o igual a 0)');
      // NaN makes the form validation block the submit until it is fixed.
      applyPrice(Number.NaN);
      return;
    }
    setPriceError('');
    applyPrice(parsed);
  };

  const resetPrice = () => {
    setPriceText(String(listPrice));
    setPriceError('');
    applyPrice(listPrice);
  };
  const imageAccessibilityLabel = `Imagen del producto ${detail.product.name}`;
  return (
    <View
      style={[appStyles.bgGray, styles.container]}
      accessible={false}
      accessibilityLabel={`Detalle de producto ${
        detail.product.name
      }, cantidad ${detail.quantity}, precio ${money(
        Number(detail.price) || 0,
      )}`}
    >
      <View
        style={[appStyles.flexRow, appStyles.justifyBetween, styles.details]}
      >
        <Text
          style={[appStyles.textDark, appStyles.subTitle, styles.itemControls]}
        >
          {detail.product.name} - {money(Number(detail.price) || 0)}
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
      {editablePrice && !readonly && (
        <View style={styles.priceBox}>
          <View style={[appStyles.flexRow, appStyles.alignCenter]}>
            <Text style={[appStyles.textDark, styles.priceLabel]}>
              Precio unitario {currencySymbol}
            </Text>
            <TextInput
              style={[
                styles.priceInput,
                !!priceError && { borderColor: appColors.danger },
              ]}
              value={priceText}
              onChangeText={onChangePrice}
              keyboardType="decimal-pad"
              selectTextOnFocus
              accessibilityLabel={`Precio unitario de ${detail.product.name}`}
              accessibilityHint={`Precio del producto: ${money(
                listPrice,
              )}. Puedes cambiarlo solo para esta venta.`}
            />
            {adjustment !== null && (
              <TouchableOpacity
                onPress={resetPrice}
                style={styles.resetBtn}
                accessibilityRole="button"
                accessibilityLabel={`Restablecer al precio del producto, ${money(
                  listPrice,
                )}`}
              >
                <Text style={styles.resetText}>Restablecer</Text>
              </TouchableOpacity>
            )}
          </View>
          {!!priceError && (
            <Text style={styles.priceError} accessibilityRole="alert">
              {priceError}
            </Text>
          )}
          {adjustment !== null && !priceError && (
            <View style={[appStyles.flexRow, appStyles.alignCenter]}>
              <Text style={[appStyles.textDark, styles.listPrice]}>
                {money(listPrice)}
              </Text>
              <Text
                style={[
                  styles.adjustment,
                  {
                    color: adjustment < 0 ? appColors.danger : PRICE_UP_COLOR,
                  },
                ]}
              >
                {adjustment > 0 ? '+' : '−'}
                {formatPct(Math.abs(adjustment))}
              </Text>
            </View>
          )}
          {belowCost && !priceError && (
            <Text style={styles.belowCost} accessibilityRole="alert">
              Por debajo del costo ({money(Number(detail.unitCost))}): esta
              venta tendrá pérdida.
            </Text>
          )}
          <Text style={[appStyles.textDark, styles.subtotal]}>
            Subtotal: {money(Number(detail.total) || 0)}
          </Text>
        </View>
      )}
      <Image
        style={styles.image}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={imageAccessibilityLabel}
        source={
          detail.product.image
            ? {
                uri: resolveImageUri(detail.product.image),
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
  priceBox: { width: '100%', marginBottom: 8 },
  priceLabel: { fontSize: 14 },
  priceInput: {
    minWidth: 90,
    minHeight: 40,
    marginLeft: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: appColors.primary,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'right',
    color: appColors.black,
    backgroundColor: appColors.white,
  },
  resetBtn: { marginLeft: 8, paddingVertical: 8, paddingHorizontal: 4 },
  resetText: { color: appColors.primary, fontWeight: '600', fontSize: 13 },
  priceError: { color: appColors.danger, fontSize: 12, marginTop: 4 },
  listPrice: {
    fontSize: 13,
    marginTop: 4,
    textDecorationLine: 'line-through',
  },
  adjustment: { fontSize: 13, fontWeight: '700', marginLeft: 8, marginTop: 4 },
  belowCost: { color: BELOW_COST_COLOR, fontSize: 12, marginTop: 4 },
  subtotal: { fontSize: 14, fontWeight: '600', marginTop: 6 },
  image: {
    width: '100%' as DimensionValue,
    height: 100,
    resizeMode: 'contain',
  },
});
