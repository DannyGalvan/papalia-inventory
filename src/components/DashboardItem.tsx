import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DEFAULT_CURRENCY_SYMBOL, KEY_CURRENCY_SYMBOL } from '../config/constants';
import { DashboardResponse } from '../database/models/response/DashboardResponse';
import { getConfigurationByKey } from '../database/repository/ConfigurationRepository';
import { useTheme } from '../hooks/useTheme';
import { formatCurrency } from '../utils/formatCurrency';

export const DashboardItem = ({item}: {item: DashboardResponse}) => {
  const {theme} = useTheme();
  const [currencySymbol, setCurrencySymbol] = useState(DEFAULT_CURRENCY_SYMBOL);

  useEffect(() => {
    getConfigurationByKey(KEY_CURRENCY_SYMBOL).then(config => {
      if (config?.value) {setCurrencySymbol(config.value);}
    });
  }, []);

  const accessibilityLabel = `Tipo de transacción ${item.tipo}. Cantidad ${item.cantidad} productos. Total ${formatCurrency(item.total, currencySymbol)}`;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.item,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          borderLeftColor: theme.colors.primary,
        },
        theme.elevation.low,
      ]}>
      <View style={styles.row}>
        <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Tipo</Text>
        <Text style={[styles.value, {color: theme.colors.text}]}>{item.tipo}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Cantidad</Text>
        <Text style={[styles.value, {color: theme.colors.text}]}>{item.cantidad} uds</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Total</Text>
        <Text style={[styles.value, {color: theme.colors.primary}]}>
          {formatCurrency(item.total, currencySymbol)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 14,
    marginVertical: 6,
    borderLeftWidth: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {fontSize: 13, fontWeight: '600'},
  value: {fontSize: 14, fontWeight: '700'},
});
