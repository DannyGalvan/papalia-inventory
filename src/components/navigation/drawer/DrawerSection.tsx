import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface Props {
  title: string;
  children: ReactNode;
}

/** Titled group of drawer rows. */
export const DrawerSection = ({ title, children }: Props) => {
  const { theme } = useTheme();

  return (
    <View style={{ paddingVertical: theme.spacing.sm }}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.overline.fontSize,
            fontWeight: theme.typography.overline.fontWeight,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xs,
          },
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
