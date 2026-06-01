import React from 'react';
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  iconName: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Fab = ({
  iconName,
  onPress,
  style,
  isLoading,
  accessibilityLabel,
  accessibilityHint,
}: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.blackButton, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Botón de acción'}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled: isLoading, busy: isLoading}}>
      {!isLoading ? (
        <Icon name={iconName} size={35} color="white" />
      ) : (
        <ActivityIndicator color="white" size={30} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  blackButton: {
    zIndex: 9999,
    height: 50,
    width: 50,
    minHeight: 44,
    minWidth: 44,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.46,
    shadowRadius: 11.14,
    elevation: 17,
  },
});
