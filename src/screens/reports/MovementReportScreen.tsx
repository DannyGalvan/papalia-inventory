import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ReportCard } from '../../components/ReportCard';
import { useTheme } from '../../hooks/useTheme';
import {
    getMovementReportData,
    MovementReportData,
} from '../../services/ReportService';

export function MovementReportScreen() {
  const {theme} = useTheme();
  const [data, setData] = useState<MovementReportData | null>(null);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;
    try {
      const result = await getMovementReportData();
      setData(result);
    } catch (error) {
      console.log('MovementReportScreen error:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const hasData =
    data &&
    (data.totalEntryQuantity > 0 ||
      data.totalExitQuantity > 0 ||
      data.movementsByType.length > 0);

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
        Reporte de Movimientos
      </Text>

      {!hasData ? (
        <Text style={[styles.emptyText, {color: theme.colors.textSecondary}]}>
          No hay movimientos registrados
        </Text>
      ) : (
        <>
          <ReportCard title="Entradas vs Salidas">
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text
                  style={[
                    styles.comparisonLabel,
                    {color: theme.colors.textSecondary},
                  ]}>
                  Entradas
                </Text>
                <Text style={[styles.comparisonValue, {color: theme.colors.text}]}>
                  {data.totalEntryQuantity}
                </Text>
              </View>
              <View style={styles.comparisonItem}>
                <Text
                  style={[
                    styles.comparisonLabel,
                    {color: theme.colors.textSecondary},
                  ]}>
                  Salidas
                </Text>
                <Text style={[styles.comparisonValue, {color: theme.colors.text}]}>
                  {data.totalExitQuantity}
                </Text>
              </View>
            </View>
          </ReportCard>

          <ReportCard title="Movimientos por Tipo">
            {data.movementsByType.map((movement, index) => (
              <View key={`${movement.typeName}-${movement.isInput}-${index}`} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={[styles.rowLabel, {color: theme.colors.text}]}>
                    {movement.typeName}
                  </Text>
                  <Text
                    style={[
                      styles.rowBadge,
                      {color: theme.colors.textSecondary},
                    ]}>
                    {movement.isInput ? 'Entrada' : 'Salida'}
                  </Text>
                </View>
                <Text style={[styles.rowValue, {color: theme.colors.text}]}>
                  {movement.totalQuantity}
                </Text>
              </View>
            ))}
          </ReportCard>

          <ReportCard title="Top 5 Categorías">
            {data.topCategories.map((category, index) => (
              <View key={`top-${category.typeName}-${index}`} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={[styles.rowLabel, {color: theme.colors.text}]}>
                    {category.typeName}
                  </Text>
                  <Text
                    style={[
                      styles.rowBadge,
                      {color: theme.colors.textSecondary},
                    ]}>
                    {category.isInput ? 'Entrada' : 'Salida'}
                  </Text>
                </View>
                <Text style={[styles.rowValue, {color: theme.colors.text}]}>
                  {category.totalQuantity}
                </Text>
              </View>
            ))}
          </ReportCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    textAlign: 'center',
    paddingVertical: 10,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  rowLeft: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowBadge: {
    fontSize: 12,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
