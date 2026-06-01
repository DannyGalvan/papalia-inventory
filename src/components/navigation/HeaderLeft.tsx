import { NativeStackHeaderBackProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

export const HeaderLeft = ({}: NativeStackHeaderBackProps) => {
  return (
    <Image
      source={require('../../assets/papalia_transparent.png')}
      style={styles.logo}
      accessibilityRole="image"
      accessibilityLabel="Logotipo de Papalia Inventario"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 150,
    height: 50,
    resizeMode: 'contain',
    marginLeft: -20,
  },
});
