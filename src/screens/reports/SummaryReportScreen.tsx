import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ReportCard } from '../../components/ReportCard';
import {
    DEFAULT_CURRENCY_SYMBOL,
    DEFAULT_LOW_STOCK_THRESHOLD,
    KEY_CURRENCY_SYMBOL,
    KEY_LOW_STOCK_THRESHOLD,
} from '../../config/constants';
import { getConfigurationByKey } from '../../database/repository/ConfigurationRepository';
import { useTheme } from '../../hooks/useTheme';
import {
    getSummaryReportData,
    SummaryReportData,
} from '../../services/ReportService';
import { formatCurrency } from '../../utils/formatCurrency';

const INITIAL_DATA: SummaryReportData = {
  totalProducts: 0,
  totalInventoryValue: 0,
  totalUnitsInStock: 0,
  stockDistribution: {
    zero: 0,
    low: 0,
    medium: 0,
    high: 0,
    veryHigh: 0,
  },
};

export function SummaryReportScreen() {
  const {theme} = useTheme();
  const [data, setData] = useState<SummaryReportData>(INITIAL_DATA);
  const [currencySymbol, setCurrencySymbol] = useState(DEFAULT_CURRENCY_SYMBOL);
  const [threshold, setThreshold] = useState(DEFAULT_LOW_STOCK_THRESHOLD);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;
    try {
      const [symbolConfig, thresholdConfig] = await Promise.all([
        getConfigurationByKey(KEY_CURRENCY_SYMBOL),
        getConfigurationByKey(KEY_LOW_STOCK_THRESHOLD),
      ]);
      const symbol = symbolConfig?.value || DEFAULT_CURRENCY_SYMBOL;
      const resolvedThreshold = thresholdConfig
        ? parseInt(thresholdConfig.value, 10) || DEFAULT_LOW_STOCK_THRESHOLD
        : DEFAULT_LOW_STOCK_THRESHOLD;
      setCurrencySymbol(symbol);
      setThreshold(resolvedThreshold);
      const result = await getSummaryReportData(resolvedThreshold);
      setData(result);
    } catch (error) {
      console.log('SummaryReportScreen error:', error);
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
            fontSize: theme.typography.h2.fontSize,
            fontWeight: theme.typography.h2.fontWeight,
            lineHeight: theme.typography.h2.lineHeight,
          },
        ]}
        accessibilityRole="header">
        Resumen General
      </Text>

      <ReportCard title="Total de productos">
        <Text
          style={[styles.value, {color: theme.colors.text}]}
          accessibilityLabel={`Total de productos: ${data.totalProducts}`}>
          {data.totalProducts}
        </Text>
      </ReportCard>

      <ReportCard title="Valor total del inventario">
        <Text
          style={[styles.value, {color: theme.colors.text}]}
          accessibilityLabel={`Valor total del inventario: ${formatCurrency(data.totalInventoryValue)}`}>
          {formatCurrency(data.totalInventoryValue, currencySymbol)}
        </Text>
      </ReportCard>

      <ReportCard title="Total de unidades en stock">
        <Text
          style={[styles.value, {color: theme.colors.text}]}
          accessibilityLabel={`Total de unidades en stock: ${data.totalUnitsInStock}`}>
          {data.totalUnitsInStock}
        </Text>
      </ReportCard>

      <ReportCard title="Distribución de stock">
        <View style={styles.distributionContainer}>
          <View style={styles.distributionRow}>
            <Text style={[styles.distributionLabel, {color: theme.colors.text}]}>
              0 unidades
            </Text>
            <Text style={[styles.distributionValue, {color: theme.colors.text}]}>
              {data.stockDistribution.zero}
            </Text>
          </View>
          <View style={styles.distributionRow}>
            <Text style={[styles.distributionLabel, {color: theme.colors.text}]}>
              1-{threshold} unidades
            </Text>
            <Text style={[styles.distributionValue, {color: theme.colors.text}]}>
              {data.stockDistribution.low}
            </Text>
          </View>
          <View style={styles.distributionRow}>
            <Text style={[styles.distributionLabel, {color: theme.colors.text}]}>
              {threshold + 1}-{threshold * 4} unidades
            </Text>
            <Text style={[styles.distributionValue, {color: theme.colors.text}]}>
              {data.stockDistribution.medium}
            </Text>
          </View>
          <View style={styles.distributionRow}>
            <Text style={[styles.distributionLabel, {color: theme.colors.text}]}>
              {threshold * 4 + 1}-{threshold * 10} unidades
            </Text>
            <Text style={[styles.distributionValue, {color: theme.colors.text}]}>
              {data.stockDistribution.high}
            </Text>
          </View>
          <View style={styles.distributionRow}>
            <Text style={[styles.distributionLabel, {color: theme.colors.text}]}>
              {'>'} {threshold * 10} unidades
            </Text>
            <Text style={[styles.distributionValue, {color: theme.colors.text}]}>
              {data.stockDistribution.veryHigh}
            </Text>
          </View>
        </View>
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
    paddingVertical: 10,
    fontStyle: 'italic',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  distributionContainer: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  distributionLabel: {
    fontSize: 14,
  },
  distributionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
