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

/**
 * ProductItem — modern themed card for the product FlatList.
 *
 * Uses theme.colors.surface as the card background with a colored left border
 * indicating stock status (green = available, red = depleted). This provides
 * good contrast in both light and dark themes.
 */
const ProductItemInner = ({product, isVisible = true}: {product: Product; isVisible?: boolean}) => {
  const noImage = require('../../assets/sin_imagen.png');
  const {navigate} = useNavigation<NavigationProp<ProductStackParamList>>();
  const {theme} = useTheme();

  const nonExistentProduct = product.stock === 0;
  const statusColor = nonExistentProduct
    ? theme.colors.stockDepleted
    : theme.colors.stockAvailable;

  const onPress = useCallback(() => {
    navigate('EditProduct', {id: product.code});
  }, [navigate, product.code]);

  const accessibilityLabel =
    `Producto ${product.name}, código ${product.code}, ` +
    `precio Q${product.price}, ` +
    `${product.stock} en inventario`;

  const accessibilityHint = nonExistentProduct
    ? 'Producto sin inventario disponible. Toca dos veces para editar el producto.'
    : 'Toca dos veces para editar el producto.';

  const imageAccessibilityLabel = `Imagen del producto ${product.name}`;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          borderLeftColor: statusColor,
        },
        theme.elevation.low,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}>
      {/* Header row: code + name */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.name, {color: theme.colors.text}]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.code, {color: theme.colors.textSecondary}]}>
            Código: {product.code}
          </Text>
        </View>
        {/* Stock badge */}
        <View style={[styles.badge, {backgroundColor: statusColor}]}>
          <Text style={styles.badgeText}>
            {product.stock}
          </Text>
        </View>
      </View>

      {/* Description */}
      {!!product.description && (
        <Text
          style={[styles.description, {color: theme.colors.textSecondary}]}
          numberOfLines={2}>
          {product.description}
        </Text>
      )}

      {/* Price + Image row */}
      <View style={styles.footer}>
        <Text style={[styles.price, {color: theme.colors.primary}]}>
          Q {Number(product.price).toFixed(2)}
        </Text>
        {nonExistentProduct && (
          <Text style={[styles.depletedLabel, {color: theme.colors.stockDepleted}]}>
            Sin stock
          </Text>
        )}
      </View>

      {/* Product image */}
      {(product.image || !isVisible) && (
        isVisible ? (
          <Image
            style={[styles.image, {borderRadius: theme.borderRadius.sm}]}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={imageAccessibilityLabel}
            source={product.image ? {uri: product.image} : noImage}
          />
        ) : (
          <View
            style={[styles.image, styles.imagePlaceholder, {backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.sm}]}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={imageAccessibilityLabel}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    marginVertical: 6,
    padding: 14,
    borderLeftWidth: 4,
    minHeight: 44,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  code: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  depletedLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  image: {
    width: '100%' as DimensionValue,
    height: 150,
    marginTop: 10,
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const ProductItem = React.memo(ProductItemInner);
