import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useTimezone } from '../../context/TimezoneContext';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  date: Date;
  setDate: (date: Date) => void;
  label: string;
  isFinal: boolean;
}

export const InputDate = ({date, setDate, label, isFinal}: Props) => {
  const {theme} = useTheme();
  const {formatDate} = useTimezone();
  const [open, setOpen] = useState(false);
  const formattedDate = formatDate(date);

  return (
    <View>
      <Text
        style={[styles.labelDate, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize, fontWeight: '600'}]}
        accessibilityRole="header">
        {label}
      </Text>
      <Text
        onPress={() => setOpen(true)}
        style={[
          styles.date,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
          },
          theme.elevation.low,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formattedDate}`}
        accessibilityHint="Toca para seleccionar una fecha">
        {formattedDate}
      </Text>
      {open && (
        <DatePicker
          modal
          open={open}
          date={date}
          mode="date"
          onConfirm={data => {
            setOpen(false);
            if (isFinal) {
              data.setHours(23, 59, 59, 999);
            } else {
              data.setHours(0, 0, 0, 0);
            }
            setDate(data);
          }}
          onCancel={() => setOpen(false)}
          title="Selecciona una fecha"
          cancelText="Cancelar"
          confirmText="Ok"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  labelDate: {
    marginHorizontal: 20,
  },
  date: {
    height: 44,
    textAlignVertical: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
    marginHorizontal: 20,
    lineHeight: 44,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
