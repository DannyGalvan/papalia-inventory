import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ALL_IN_OUT_ENUM } from '../config/constants';
import { useTimezone } from '../context/TimezoneContext';
import { LogHeader } from '../database/models/LogHeader';
import { MovementType } from '../database/models/MovementType';
import { useTheme } from '../hooks/useTheme';

interface Props {
  logHeader: LogHeader;
  navigation: (id: number) => void;
  typeCatalog?: MovementType[];
}

export const LogItems = ({logHeader, navigation, typeCatalog}: Props) => {
  const {theme} = useTheme();
  const {formatDateTime} = useTimezone();
  const typeLabel = typeCatalog
    ? typeCatalog.find(t => t.id === logHeader.type)?.name ?? `Tipo ${logHeader.type}`
    : ALL_IN_OUT_ENUM[logHeader.type as keyof typeof ALL_IN_OUT_ENUM] ?? `Tipo ${logHeader.type}`;
  const isInput = logHeader.isInput;
  const badgeColor = isInput ? theme.colors.success : theme.colors.error;
  const badgeIcon = isInput ? 'arrow-down-circle' : 'arrow-up-circle';
  const badgeLabel = isInput ? 'Entrada' : 'Salida';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md},
        theme.elevation.low,
      ]}
      onPress={() => navigation(logHeader.id)}
      accessibilityRole="button"
      accessibilityLabel={`${badgeLabel}: ${typeLabel}. ${logHeader.comments || 'sin comentarios'}`}
      accessibilityHint="Toca para ver el detalle completo del movimiento">

      {/* Top row: badge + type + chevron */}
      <View style={styles.topRow}>
        <View style={[styles.badge, {backgroundColor: badgeColor + '22', borderColor: badgeColor}]}>
          <Icon name={badgeIcon} size={13} color={badgeColor} />
          <Text style={[styles.badgeText, {color: badgeColor}]}>{badgeLabel}</Text>
        </View>
        <Text
          style={[styles.typeText, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}
          numberOfLines={1}>
          {typeLabel}
        </Text>
        <Icon name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </View>

      {/* Date */}
      <View style={styles.metaRow}>
        <Icon name="calendar-outline" size={13} color={theme.colors.textSecondary} />
        <Text style={[styles.metaText, {color: theme.colors.textSecondary}]}>
          {formatDateTime(logHeader.createdAt)}
        </Text>
      </View>

      {/* Comments preview */}
      {!!logHeader.comments && (
        <Text
          style={[styles.comment, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}
          numberOfLines={1}>
          {logHeader.comments}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 5,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeText: {
    flex: 1,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
  },
  comment: {
    fontStyle: 'italic',
  },
});
