import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { appColors } from '../../styles/globalStyles';

/** Header action that toggles between light and dark theme. */
export const HeaderThemeButton = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Cambiar tema"
      accessibilityHint={
        isDark ? 'Cambia al tema claro' : 'Cambia al tema oscuro'
      }
    >
      <Icon
        name={isDark ? 'sunny' : 'moon'}
        size={24}
        color={appColors.warning}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    marginRight: 4,
  },
});
