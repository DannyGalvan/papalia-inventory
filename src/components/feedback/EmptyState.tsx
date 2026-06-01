/**
 * EmptyState — feedback component shown when a list (products, inputs or
 * outputs) contains zero items.
 *
 * Displays an icon, a Spanish title and a descriptive Spanish message telling
 * the user what the list will contain and how to add items. All visual values
 * (typography, spacing and colors) come from the active theme via the
 * `useTheme()` hook so the component adapts to the light/dark theme.
 *
 * Requirements: 8.7, 4.1
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';

export interface EmptyStateProps {
  /** Short Spanish title for the empty state (e.g. "Sin productos"). */
  title: string;
  /** Spanish description explaining what the list contains and how to add items. */
  description: string;
  /** Ionicons icon name to display above the title. */
  icon: string;
}

export const EmptyState = ({title, description, icon}: EmptyStateProps) => {
  const {theme} = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: theme.spacing.xxl,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description}`}>
      <Icon
        name={icon}
        size={64}
        color={theme.colors.textSecondary}
        // The icon is decorative: its meaning is already conveyed by the
        // title and description announced on the container.
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{marginBottom: theme.spacing.md}}
      />
      <Text
        accessibilityRole="header"
        style={[
          styles.title,
          {
            fontSize: theme.typography.h2.fontSize,
            fontWeight: theme.typography.h2.fontWeight,
            lineHeight: theme.typography.h2.lineHeight,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            fontSize: theme.typography.body.fontSize,
            fontWeight: theme.typography.body.fontWeight,
            lineHeight: theme.typography.body.lineHeight,
            color: theme.colors.textSecondary,
          },
        ]}>
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});

export default EmptyState;
