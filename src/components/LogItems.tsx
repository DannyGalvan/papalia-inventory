import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {LogHeader} from '../database/models/LogHeader';
import {appColors, appStyles} from '../styles/globalStyles';
import {ALL_IN_OUT_ENUM} from '../config/constants';

interface Props {
  logHeader: LogHeader;
  navigation: (id: number) => void;
}

export const LogItems = ({logHeader, navigation}: Props) => {
  return (
    <TouchableOpacity
      style={[appStyles.flexColumn, styles.container]}
      onPress={() => navigation(logHeader.id)}>
      <View
        style={[
          appStyles.flexRow,
          appStyles.justifyBetween,
          appStyles.alignCenter,
        ]}>
        <Text style={[appStyles.textWhite, appStyles.title]}>Tipo:</Text>
        <Text style={[appStyles.textWhite, appStyles.subTitle]}>
          {ALL_IN_OUT_ENUM[logHeader.type]}
        </Text>
      </View>
      <View style={[appStyles.flexColumn, appStyles.justifyCenter]}>
        <Text style={[appStyles.textWhite, appStyles.title]}>Comentarios</Text>
        <Text style={[appStyles.textWhite, appStyles.text]}>
          {logHeader.commets}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 75,
    backgroundColor: appColors.gray,
    borderRadius: 10,
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: appColors.black,
    shadowColor: appColors.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.36,
    shadowRadius: 6.68,

    elevation: 11,
  },
});
