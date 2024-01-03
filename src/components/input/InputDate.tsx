import React, {useState} from 'react';
import {appColors, appStyles} from '../../styles/globalStyles';
import {StyleSheet, Text, View} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {format, addHours} from 'date-fns';
import {es} from 'date-fns/locale';

interface Props {
  date: Date;
  setDate: (date: Date) => void;
  label: string;
  isFinal: boolean;
}

export const InputDate = ({date, setDate, label, isFinal}: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={[appStyles.subTitle, appStyles.textDark, styles.labelDate]}>
        {label}
      </Text>
      <Text
        onPress={() => setOpen(true)}
        style={[appStyles.title, appStyles.textDark, styles.date]}>
        {format(addHours(date, 6), 'dd MMMM yyyy : HH:mm', {
          locale: es,
        })}
      </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  labelDate: {
    marginHorizontal: 20,
  },
  date: {
    height: 50,
    backgroundColor: appColors.white,
    borderRadius: 10,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
    marginHorizontal: 20,
  },
});
