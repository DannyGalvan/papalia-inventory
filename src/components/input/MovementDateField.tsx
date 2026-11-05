import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTimezone } from '../../context/TimezoneContext';
import { useTheme } from '../../hooks/useTheme';
import { movementDateLabel } from '../../services/movement/movementDateLabel';
import { getUTCOffsetMs } from '../../utils/dateTime';

interface Props {
  /** Selected date; when undefined "now" is shown (resolved on save). */
  value?: Date;
  isInput: boolean;
  onChange: (date: Date) => void;
  error?: string;
  readonly?: boolean;
  /** Injected for tests; defaults to the current time. */
  now?: () => Date;
}

/**
 * Date + time picker for the business date of a movement (sale/receipt).
 * Future dates are blocked by the picker (`maximumDate`) and by validation.
 */
export const MovementDateField = ({
  value,
  isInput,
  onChange,
  error,
  readonly = false,
  now = () => new Date(),
}: Props) => {
  const { theme } = useTheme();
  const { formatDateTime, ianaTimezone } = useTimezone();
  const [open, setOpen] = useState(false);
  const [maximumDate, setMaximumDate] = useState<Date>(now);
  const label = movementDateLabel(isInput);
  const shown = value ?? now();
  const formatted = formatDateTime(shown);

  const openPicker = () => {
    // Refresh the upper bound so a form left open stays accurate.
    setMaximumDate(now());
    setOpen(true);
  };

  return (
    <View style={styles.container}>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.body.fontSize,
        }}
        accessibilityRole="header"
      >
        {label}
      </Text>
      <TouchableOpacity
        testID="movement-date-button"
        disabled={readonly}
        onPress={openPicker}
        style={[
          styles.button,
          {
            borderColor: error ? theme.colors.error : theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatted}`}
        accessibilityHint="Toca para seleccionar la fecha y hora del movimiento"
        accessibilityState={{ disabled: readonly }}
      >
        <Icon
          name="calendar-outline"
          size={18}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {formatted}
        </Text>
      </TouchableOpacity>
      {!!error && (
        <Text
          style={[
            styles.error,
            {
              color: theme.colors.error,
              fontSize: theme.typography.caption.fontSize,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {error}
        </Text>
      )}
      {open && (
        <DatePicker
          modal
          open={open}
          date={shown}
          mode="datetime"
          maximumDate={maximumDate}
          // Show wall-clock time of the configured timezone, like the label.
          timeZoneOffsetInMinutes={Math.round(
            getUTCOffsetMs(ianaTimezone, shown) / 60000,
          )}
          locale="es"
          onConfirm={date => {
            setOpen(false);
            onChange(date);
          }}
          onCancel={() => setOpen(false)}
          title={label}
          cancelText="Cancelar"
          confirmText="Ok"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  value: { fontSize: 16, fontWeight: '600' },
  error: { textAlign: 'center', marginTop: 4 },
});
