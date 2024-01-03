import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {appStyles} from '../styles/globalStyles';
import {generateRandomColor} from '../utils/dateTime';
import {DashboardResponse} from '../database/models/response/DashboardResponse';

export const DashboardItem = ({item}: {item: DashboardResponse}) => {
  return (
    <View
      style={[
        appStyles.flexColumn,
        styles.item,
        {backgroundColor: generateRandomColor()},
      ]}>
      <View style={[appStyles.flexRow, appStyles.justifyBetween]}>
        <Text style={[appStyles.text, appStyles.textWhite]}>
          Tipo de transaccion
        </Text>
        <Text style={[appStyles.text, appStyles.textWhite]}>{item.tipo}</Text>
      </View>
      <View style={[appStyles.flexRow, appStyles.justifyBetween]}>
        <Text style={[appStyles.text, appStyles.textWhite]}>Cantidad</Text>
        <Text style={[appStyles.text, appStyles.textWhite]}>
          {item.cantidad} productos
        </Text>
      </View>
      <View style={[appStyles.flexRow, appStyles.justifyBetween]}>
        <Text style={[appStyles.text, appStyles.textWhite]}>
          Total Categoria
        </Text>
        <Text style={[appStyles.text, appStyles.textWhite]}>
          Q {item.total.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 20,
  },
});
