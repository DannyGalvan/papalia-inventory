import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackHeaderItemProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { AppStackParamList } from '../../interfaces/IAppStartNavigation';
import { appColors } from '../../styles/globalStyles';

export const HeaderRight = ({}: NativeStackHeaderItemProps) => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const {isDark, toggleTheme} = useTheme();

  return (
    <View style={styles.container} accessible={false}>
      <TouchableOpacity
        onPress={toggleTheme}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Cambiar tema"
        accessibilityHint={isDark ? 'Cambia al tema claro' : 'Cambia al tema oscuro'}>
        <Icon
          name={isDark ? 'sunny' : 'moon'}
          size={24}
          color={appColors.warning}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Configuration')}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Abrir configuración"
        accessibilityHint="Abre la pantalla de configuración">
        <Icon name="settings" size={24} color={appColors.warning} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
});
