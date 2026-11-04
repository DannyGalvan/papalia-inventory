import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTimezone } from '../../context/TimezoneContext';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  cancelledAt: Date | null;
  reason: string;
}

/** Notice shown on a cancelled movement with its date and reason. */
export const CancelledMovementBanner = ({ cancelledAt, reason }: Props) => {
  const { theme } = useTheme();
  const { formatDateTime } = useTimezone();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.error,
          backgroundColor: theme.colors.error + '14',
          borderRadius: theme.borderRadius.md,
        },
      ]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`Operación cancelada${
        cancelledAt ? ` el ${formatDateTime(cancelledAt)}` : ''
      }. Motivo: ${reason || 'sin motivo'}`}
    >
      <View style={styles.titleRow}>
        <Icon name="ban-outline" size={18} color={theme.colors.error} />
        <Text style={[styles.title, { color: theme.colors.error }]}>
          Operación cancelada
        </Text>
      </View>
      {!!cancelledAt && (
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          {formatDateTime(cancelledAt)}
        </Text>
      )}
      {!!reason && (
        <Text style={[styles.reason, { color: theme.colors.text }]}>
          Motivo: {reason}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 12, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
  reason: { fontSize: 14 },
});
