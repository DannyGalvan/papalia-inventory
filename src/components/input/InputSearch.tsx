import React, {useState} from 'react';
import {DimensionValue, TextInput, TouchableOpacity, View} from 'react-native';
import {appColors, appStyles} from '../../styles/globalStyles';
import Icon from 'react-native-vector-icons/Ionicons';

export const InputSearch = ({updateFn}: {updateFn: (text: string) => void}) => {
  const [query, setQuery] = useState<string>('');

  return (
    <View style={[appStyles.flexRow, styles.container]}>
      <TextInput
        style={styles.search}
        placeholder="Buscar producto..."
        onChangeText={text => setQuery(text)}
        value={query}
        placeholderTextColor={appColors.gray}
      />
      <TouchableOpacity
        style={[
          styles.button,
          appStyles.justifyCenter,
          appStyles.flexRow,
          appStyles.alignCenter,
        ]}
        onPress={() => updateFn(query)}>
        <Icon name="search" size={20} color={appColors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    width: '100%' as DimensionValue,
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  search: {
    backgroundColor: appColors.white,
    color: appColors.black,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: '85%' as DimensionValue,
    borderWidth: 1,
  },
  button: {
    backgroundColor: appColors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    width: '15%' as DimensionValue,
  },
};
