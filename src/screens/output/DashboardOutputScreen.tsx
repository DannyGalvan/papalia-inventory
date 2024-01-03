import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {appStyles} from '../../styles/globalStyles';
import {DashboardResponse} from '../../database/models/response/DashboardResponse';
import {getDashboardOutputs} from '../../database/repository/LogHeaderRepository';
import {useFocusEffect} from '@react-navigation/native';
import {DashboardItem} from '../../components/DashboardItem';

export const DashboardOutputScreen = () => {
  const [response, setResponse] = useState<DashboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    (async () => {
      setIsLoading(true);
      const data = await getDashboardOutputs();
      setResponse(data);
      setIsLoading(false);
    })();
  };

  useFocusEffect(useCallback(loadData, []));

  return (
    <View style={appStyles.screen}>
      <Text style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
        Dashboard de salidas
      </Text>
      <FlatList
        style={[styles.list]}
        data={Object.keys(response).map(key => response[key])}
        renderItem={({item}) => <DashboardItem item={item} />}
        refreshing={isLoading}
        onRefresh={loadData}
        keyExtractor={item => item.tipo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: 5,
  },
});
