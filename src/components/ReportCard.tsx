import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ReportCardProps {
  title: string;
  children: React.ReactNode;
}

export const ReportCard = ({title, children}: ReportCardProps) => {
  const {theme} = useTheme();

  return (
    <View
      accessible={true}
      accessibilityRole="summary"
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
        },
        theme.elevation.low,
      ]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
});
