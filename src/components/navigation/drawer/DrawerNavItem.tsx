import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../hooks/useTheme';

interface Props {
  label: string;
  icon: string;
  active?: boolean;
  onPress: () => void;
}

/** Hex alpha suffix (~13%) used to tint the active item background. */
const ACTIVE_TINT_ALPHA = '22';

/** Single tappable drawer row: icon + label, highlighted when active. */
export const DrawerNavItem = ({
  label,
  icon,
  active = false,
  onPress,
}: Props) => {
  const { theme } = useTheme();
  const color = active ? theme.colors.primary : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.md,
        },
        active && {
          backgroundColor: `${theme.colors.primary}${ACTIVE_TINT_ALPHA}`,
        },
        pressed && !active && { backgroundColor: theme.colors.background },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Icon name={icon} size={22} color={color} />
      <Text
        style={[
          styles.label,
          {
            color,
            fontSize: theme.typography.body.fontSize,
          },
          active && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 1,
  },
  label: {
    flex: 1,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '700',
  },
});
