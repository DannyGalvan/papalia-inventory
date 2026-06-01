import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    DimensionValue,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Product } from '../../database/models/Product';
import { useTheme } from '../../hooks/useTheme';
import { ProductStackParamList } from '../../interfaces/IProductNavigation';

interface Props {
  product: Product;
  isVisible?: boolean;
  currencySymbol?: string;
}

const ProductItemInner = ({product, isVisible = true, currencySymbol = 'Q'}: Props) => {
  const noImage = require('../../assets/sin_imagen.png');
  const {navigate} = useNavigation<NavigationProp<ProductStackParamList>>();
  const {theme} = useTheme();

  const nonExistentProduct = product.stock === 0;
  const statusColor = nonExistentProduct ? theme.colors.stockDepleted : theme.colors.stockAvailable;
  const unitAbbrev = product.unitOfMeasure?.abbreviation ?? 'uds';

  const onPress = useCallback(() => {
    navigate('EditProduct', {id: product.code});
  }, [navigate, product.code]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderLeftColor: statusColor},
        theme.elevation.low,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Producto ${product.name}, código ${product.code}, precio ${currencySymbol}${product.price}, ${product.stock} ${unitAbbrev} en inventario`}
      accessibilityHint={nonExistentProduct ? 'Sin stock. Toca para editar.' : 'Toca para editar.'}>

      {/* Header: name + stock badge */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.name, {color: theme.colors.text}]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.code, {color: theme.colors.textSecondary}]}>
            Código: {product.code}
          </Text>
        </View>
        <View style={[styles.badge, {backgroundColor: statusColor}]}>
          <Text style={styles.badgeText}>{product.stock}</Text>
          <Text style={styles.badgeUnit}>{unitAbbrev}</Text>
        </View>
      </View>

      {/* Category chip */}
      {product.category && (
        <View style={styles.categoryRow}>
          <View style={[styles.categoryDot, {backgroundColor: product.category.color}]} />
          <Text style={[styles.categoryLabel, {color: theme.colors.textSecondary}]}>
            {product.category.name}
          </Text>
        </View>
      )}

      {/* Description */}
      {!!product.description && (
        <Text style={[styles.description, {color: theme.colors.textSecondary}]} numberOfLines={2}>
          {product.description}
        </Text>
      )}

      {/* Footer: price */}
      <View style={styles.footer}>
        <Text style={[styles.price, {color: theme.colors.primary}]}>
          {currencySymbol} {Number(product.price).toFixed(2)}
        </Text>
        {nonExistentProduct && (
          <Text style={[styles.depletedLabel, {color: theme.colors.stockDepleted}]}>
            Sin stock
          </Text>
        )}
        {product.supplier && (
          <Text style={[styles.supplierLabel, {color: theme.colors.textSecondary}]} numberOfLines={1}>
            {product.supplier.name}
          </Text>
        )}
      </View>

      {/* Image */}
      {(product.image || !isVisible) && (
        isVisible ? (
          <Image
            style={[styles.image, {borderRadius: theme.borderRadius.sm}]}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Imagen de ${product.name}`}
            source={product.image ? {uri: product.image} : noImage}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, {backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.sm}]}
            accessible accessibilityRole="image" accessibilityLabel={`Imagen de ${product.name}`}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {marginHorizontal: 4, marginVertical: 6, padding: 14, borderLeftWidth: 4, minHeight: 44},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  headerText: {flex: 1, marginRight: 10},
  name: {fontSize: 16, fontWeight: '700'},
  code: {fontSize: 12, marginTop: 2},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center', minWidth: 44},
  badgeText: {color: '#FFFFFF', fontSize: 13, fontWeight: '700'},
  badgeUnit: {color: 'rgba(255,255,255,0.85)', fontSize: 10},
  categoryRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6},
  categoryDot: {width: 8, height: 8, borderRadius: 4},
  categoryLabel: {fontSize: 12},
  description: {fontSize: 13, marginTop: 6, lineHeight: 18},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8},
  price: {fontSize: 18, fontWeight: '700'},
  depletedLabel: {fontSize: 12, fontWeight: '600'},
  supplierLabel: {fontSize: 11, flexShrink: 1},
  image: {width: '100%' as DimensionValue, height: 150, marginTop: 10, resizeMode: 'contain'},
  imagePlaceholder: {justifyContent: 'center', alignItems: 'center'},
});

export const ProductItem = React.memo(ProductItemInner);
