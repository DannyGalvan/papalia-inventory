import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ReportCard } from '../../components/ReportCard';
import {
    DEFAULT_LOW_STOCK_THRESHOLD,
    KEY_LOW_STOCK_THRESHOLD,
} from '../../config/constants';
import { getConfigurationByKey } from '../../database/repository/ConfigurationRepository';
import { useTheme } from '../../hooks/useTheme';
import {
    CriticalReportData,
    getCriticalReportData,
} from '../../services/ReportService';

export function CriticalReportScreen() {
  const {theme} = useTheme();
  const [data, setData] = useState<CriticalReportData>({
    lowStockProducts: [],
    zeroStockProducts: [],
    mostMovedProducts: [],
  });
  const [threshold, setThreshold] = useState(DEFAULT_LOW_STOCK_THRESHOLD);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;
    try {
      const thresholdConfig = await getConfigurationByKey(KEY_LOW_STOCK_THRESHOLD);
      const resolvedThreshold = thresholdConfig
        ? parseInt(thresholdConfig.value, 10) || DEFAULT_LOW_STOCK_THRESHOLD
        : DEFAULT_LOW_STOCK_THRESHOLD;
      setThreshold(resolvedThreshold);
      const reportData = await getCriticalReportData(resolvedThreshold);
      setData(reportData);
    } catch (error) {
      console.log('CriticalReportScreen error:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.h1.fontSize,
            fontWeight: theme.typography.h1.fontWeight,
            lineHeight: theme.typography.h1.lineHeight,
          },
        ]}
        accessibilityRole="header">
        Reporte Crítico
      </Text>

      <ReportCard title={`Productos con stock bajo (≤ ${threshold})`}>
        {data.lowStockProducts.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.body.fontSize,
                lineHeight: theme.typography.body.lineHeight,
              },
            ]}>
            No hay productos con stock bajo
          </Text>
        ) : (
          data.lowStockProducts.map(product => (
            <View
              key={product.code}
              style={[
                styles.productRow,
                {borderBottomColor: theme.colors.border},
              ]}>
              <Text
                style={[
                  styles.productName,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.body.fontSize,
                    lineHeight: theme.typography.body.lineHeight,
                  },
                ]}
                numberOfLines={1}>
                {product.name}
              </Text>
              <Text
                style={[
                  styles.stockBadge,
                  {
                    color: theme.colors.warning,
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.caption.fontWeight,
                    lineHeight: theme.typography.caption.lineHeight,
                  },
                ]}>
                Stock: {product.stock}
              </Text>
            </View>
          ))
        )}
      </ReportCard>

      <ReportCard title="Productos sin stock">
        {data.zeroStockProducts.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.body.fontSize,
                lineHeight: theme.typography.body.lineHeight,
              },
            ]}>
            No hay productos sin stock
          </Text>
        ) : (
          data.zeroStockProducts.map(product => (
            <View
              key={product.code}
              style={[
                styles.productRow,
                {borderBottomColor: theme.colors.border},
              ]}>
              <Text
                style={[
                  styles.productName,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.body.fontSize,
                    lineHeight: theme.typography.body.lineHeight,
                  },
                ]}
                numberOfLines={1}>
                {product.name}
              </Text>
              <Text
                style={[
                  styles.stockBadge,
                  {
                    color: theme.colors.error,
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.caption.fontWeight,
                    lineHeight: theme.typography.caption.lineHeight,
                  },
                ]}>
                Stock: 0
              </Text>
            </View>
          ))
        )}
      </ReportCard>

      <ReportCard title="Productos más movidos">
        {data.mostMovedProducts.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.body.fontSize,
                lineHeight: theme.typography.body.lineHeight,
              },
            ]}>
            No hay productos con movimientos
          </Text>
        ) : (
          data.mostMovedProducts.map((product, index) => (
            <View
              key={product.code}
              style={[
                styles.productRow,
                {borderBottomColor: theme.colors.border},
              ]}>
              <Text
                style={[
                  styles.productName,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.body.fontSize,
                    lineHeight: theme.typography.body.lineHeight,
                  },
                ]}
                numberOfLines={1}>
                {index + 1}. {product.name}
              </Text>
              <Text
                style={[
                  styles.quantityBadge,
                  {
                    color: theme.colors.primary,
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.caption.fontWeight,
                    lineHeight: theme.typography.caption.lineHeight,
                  },
                ]}>
                {product.totalQuantity} uds
              </Text>
            </View>
          ))
        )}
      </ReportCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productName: {
    flex: 1,
    marginRight: 8,
  },
  stockBadge: {
    fontWeight: '600',
  },
  quantityBadge: {
    fontWeight: '600',
  },
});
