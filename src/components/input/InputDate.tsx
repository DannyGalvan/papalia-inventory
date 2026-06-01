import { addHours, format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  date: Date;
  setDate: (date: Date) => void;
  label: string;
  isFinal: boolean;
}

export const InputDate = ({date, setDate, label, isFinal}: Props) => {
  const {theme} = useTheme();
  const [open, setOpen] = useState(false);
  const formattedDate = format(addHours(date, 6), 'dd MMMM yyyy : HH:mm', {
    locale: es,
  });

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
          date={new Date(addHours(date, 6))}
          mode="date"
          onConfirm={data => {
            setOpen(false);
            isFinal ? data.setHours(17, 59, 59, 59) : data.setHours(-6, 0, 0, 0);
            setDate(data);
          }}
          onCancel={() => {
            setOpen(false);
          }}
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
