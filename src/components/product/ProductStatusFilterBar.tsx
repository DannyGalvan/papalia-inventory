import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProductStatusFilter } from '../../database/repository/productStatus';
import { useTheme } from '../../hooks/useTheme';

const OPTIONS: ReadonlyArray<{ value: ProductStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

interface Props {
  value: ProductStatusFilter;
  onChange: (value: ProductStatusFilter) => void;
}

/** Segmented control to filter products by active status. */
export const ProductStatusFilterBar = ({ value, onChange }: Props) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.md,
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel="Filtrar productos por estado"
    >
      {OPTIONS.map(option => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              selected && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`Mostrar productos ${option.label.toLowerCase()}`}
          >
            <Text
              style={[
                styles.label,
                selected ? styles.labelSelected : { color: theme.colors.text },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    marginHorizontal: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  option: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontWeight: '600' },
  labelSelected: { color: '#FFFFFF' },
});
