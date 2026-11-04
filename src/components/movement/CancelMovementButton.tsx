import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  isInput: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/** Destructive action that opens the cancellation dialog. */
export const CancelMovementButton = ({ isInput, disabled, onPress }: Props) => {
  const { theme } = useTheme();
  const label = isInput ? 'Cancelar entrada' : 'Cancelar salida';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          borderColor: theme.colors.error,
          borderRadius: theme.borderRadius.lg,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Anula la operación y revierte su efecto en el inventario"
    >
      <Icon name="close-circle-outline" size={20} color={theme.colors.error} />
      <Text style={[styles.text, { color: theme.colors.error }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    minHeight: 48,
    marginTop: 8,
  },
  text: { fontSize: 16, fontWeight: '700' },
});
