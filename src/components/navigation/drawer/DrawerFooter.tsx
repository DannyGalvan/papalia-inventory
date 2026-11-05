import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface Props {
  version: string;
  bottomInset?: number;
}

/** Footer pinned to the bottom of the drawer showing the app version. */
export const DrawerFooter = ({ version, bottomInset = 0 }: Props) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.sm + bottomInset,
        },
      ]}
    >
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.caption.fontSize,
        }}
      >
        Versión {version}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
