import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../hooks/useTheme';

interface Props {
  label: string;
}

/** Drawer row with a switch that flips between light and dark theme. */
export const DrawerThemeToggle = ({ label }: Props) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      style={[
        styles.row,
        { paddingHorizontal: theme.spacing.md, gap: theme.spacing.md },
      ]}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: isDark }}
    >
      <Icon
        name={isDark ? 'moon' : 'moon-outline'}
        size={22}
        color={theme.colors.text}
      />
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.text,
            fontSize: theme.typography.body.fontSize,
          },
        ]}
      >
        {label}
      </Text>
      <View importantForAccessibility="no-hide-descendants">
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{
            true: theme.colors.primary,
            false: theme.colors.border,
          }}
          accessible={false}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  label: {
    flex: 1,
    fontWeight: '500',
  },
});
