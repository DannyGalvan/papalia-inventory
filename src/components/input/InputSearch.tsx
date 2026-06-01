import React, { useState } from 'react';
import { DimensionValue, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { appColors, appStyles } from '../../styles/globalStyles';

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
        accessibilityLabel="Buscar productos"
        accessibilityHint="Escribe el código o nombre del producto que deseas buscar"
        returnKeyType="search"
        onSubmitEditing={() => updateFn(query)}
      />
      <TouchableOpacity
        style={[
          styles.button,
          appStyles.justifyCenter,
          appStyles.flexRow,
          appStyles.alignCenter,
        ]}
        onPress={() => updateFn(query)}
        accessibilityRole="button"
        accessibilityLabel="Buscar"
        accessibilityHint="Inicia la búsqueda de productos">
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
    minHeight: 44,
    borderWidth: 1,
  },
  button: {
    backgroundColor: appColors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    minHeight: 44,
    minWidth: 44,
    width: '15%' as DimensionValue,
  },
};
