import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { Fab } from '../../components/button/Fab';
import { EmptyState } from '../../components/feedback/EmptyState';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { Toast } from '../../components/feedback/Toast';
import { InputSearch } from '../../components/input/InputSearch';
import { ProductItem } from '../../components/product/ProductItem';
import { ProductStatusFilterBar } from '../../components/product/ProductStatusFilterBar';
import { Product } from '../../database/models/Product';
import { getConfigurationByKey } from '../../database/repository/ConfigurationRepository';
import { getFullProducts } from '../../database/repository/ProductRepository';
import {
  PRODUCT_LIST_PERFORMANCE_PROPS,
  useProducts,
} from '../../hooks/useProducts';
import { useTheme } from '../../hooks/useTheme';
import {
  DEFAULT_CURRENCY_SYMBOL,
  KEY_CURRENCY_SYMBOL,
} from '../../config/constants';
import { ProductListScreenProps } from '../../interfaces/IProductNavigation';
import { excelService } from '../../services/ExcelService';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
};

export const ProductListScreen = ({ navigation }: ProductListScreenProps) => {
  const { theme } = useTheme();
  const {
    products,
    total,
    loadData,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    searchProducts,
    error,
    clearError,
    statusFilter,
    setStatusFilter,
  } = useProducts();
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(DEFAULT_CURRENCY_SYMBOL);

  useEffect(() => {
    getConfigurationByKey(KEY_CURRENCY_SYMBOL).then(config => {
      if (config?.value) {
        setCurrencySymbol(config.value);
      }
    });
  }, []);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning') => {
      setToast({ visible: true, message, type });
    },
    [],
  );

  const dismissToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const downloadFile = useCallback(async () => {
    try {
      setIsLoadingDownload(true);
      const data = await getFullProducts();
      const filePath = await excelService.exportProducts(data);
      const fileName = filePath.split('/').pop() ?? filePath;
      const location = Platform.OS === 'ios' ? 'Archivos (app)' : 'Descargas';
      showToast(`Guardado en ${location}: ${fileName}`, 'success');
    } catch (e) {
      const errorMessage =
        (e as Error)?.message || 'Error al descargar el archivo';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoadingDownload(false);
    }
  }, [showToast]);

  // Show error from useProducts hook as a toast
  React.useEffect(() => {
    if (error) {
      showToast(error, 'error');
      clearError();
    }
  }, [error, showToast, clearError]);

  // Track which items are currently visible for lazy image loading (Req 9.4).
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleCodes = new Set(
        viewableItems
          .filter(token => token.isViewable && token.item)
          .map(token => (token.item as Product).code),
      );
      setVisibleItems(visibleCodes);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    // Include items slightly outside the viewport for smoother loading
    waitForInteraction: false,
  }).current;

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductItem
        product={item}
        isVisible={visibleItems.has(item.code)}
        currencySymbol={currencySymbol}
      />
    ),
    [visibleItems, currencySymbol],
  );

  /** Footer loading indicator shown when loading more paginated items. */
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) {
      return null;
    }
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          Cargando más productos...
        </Text>
      </View>
    );
  }, [isLoadingMore, theme.colors.primary, theme.colors.textSecondary]);

  // Show skeleton loader during initial load (not during pull-to-refresh)
  const isInitialLoad = isLoading && products.length === 0;

  const renderEmptyList = useCallback(() => {
    if (isLoading) {
      return null;
    }
    if (statusFilter !== 'all') {
      const label = statusFilter === 'active' ? 'activos' : 'inactivos';
      return (
        <EmptyState
          title={`Sin productos ${label}`}
          description={`No se encontraron productos ${label}. Cambia el filtro para ver los demás.`}
          icon="filter-outline"
        />
      );
    }
    return (
      <EmptyState
        title="Sin productos"
        description="No hay productos en el inventario. Presiona el botón + para agregar un nuevo producto."
        icon="cube-outline"
      />
    );
  }, [isLoading, statusFilter]);

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      accessible={false}
    >
      <View>
        <Text
          style={[
            styles.totalText,
            {
              color: theme.colors.text,
              fontSize: theme.typography.body.fontSize,
            },
          ]}
          accessibilityLabel={`Total de productos: ${total}`}
        >
          Total de productos: {total}
        </Text>
      </View>
      <InputSearch updateFn={searchProducts} />
      <ProductStatusFilterBar value={statusFilter} onChange={setStatusFilter} />
      {isInitialLoad ? (
        <SkeletonLoader layout="product-list" />
      ) : (
        <FlatList
          style={styles.list}
          data={products}
          renderItem={renderProductItem}
          refreshing={isLoading}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && !isInitialLoad}
              onRefresh={loadData}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          onRefresh={loadData}
          keyExtractor={item => item.code}
          accessibilityRole="list"
          accessibilityLabel="Lista de productos del inventario"
          ListEmptyComponent={renderEmptyList}
          ListFooterComponent={renderFooter}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          {...PRODUCT_LIST_PERFORMANCE_PROPS}
        />
      )}
      <Fab
        style={[styles.fabR, { backgroundColor: theme.colors.primary }]}
        iconName="add"
        onPress={() => navigation.navigate('CreateProduct')}
        accessibilityLabel="Agregar producto"
        accessibilityHint="Abre el formulario para crear un nuevo producto"
      />
      <Fab
        style={[styles.fabL, { backgroundColor: theme.colors.success }]}
        iconName="download"
        onPress={downloadFile}
        isLoading={isLoadingDownload}
        accessibilityLabel="Descargar productos"
        accessibilityHint="Descarga la lista de productos en formato Excel"
      />
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={dismissToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  totalText: {
    textAlign: 'center',
    paddingTop: 8,
  },
  list: {
    padding: 10,
  },
  fabR: {
    bottom: 20,
    right: 20,
    position: 'absolute',
  },
  fabL: {
    bottom: 20,
    left: 20,
    position: 'absolute',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
