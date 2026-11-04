import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Toggle to enable/disable a product for inputs and outputs. */
export const ProductActiveSwitch = ({ value, onChange }: Props) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.row, { borderColor: theme.colors.border }]}>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Producto activo
        </Text>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          {value
            ? 'Disponible en búsquedas de entradas y salidas.'
            : 'Oculto en entradas y salidas. Su historial se conserva.'}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.success, false: theme.colors.border }}
        accessibilityLabel="Producto activo"
        accessibilityHint="Activa o desactiva el producto en entradas y salidas"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  texts: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 2 },
});
