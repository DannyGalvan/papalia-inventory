import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

/** Brand block at the top of the drawer. */
export const DrawerBrandHeader = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <Image
        source={require('../../../assets/papalia_transparent.png')}
        style={styles.logo}
        accessibilityRole="image"
        accessibilityLabel="Logotipo de Papalia Inventario"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: 'contain',
  },
});
