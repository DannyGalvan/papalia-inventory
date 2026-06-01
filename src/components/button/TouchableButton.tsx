import React from 'react';
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { appStyles } from '../../styles/globalStyles';

interface Props {
  styles: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  onPress: () => void;
  title?: string;
  iconColor?: string;
  icon?: string;
  iconSize?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const TouchableButton = ({
  styles,
  icon,
  onPress,
  textStyle,
  title,
  iconColor,
  iconSize,
  accessibilityLabel,
  accessibilityHint,
}: Props) => {
  return (
    <TouchableOpacity
      style={[appStyles.button, touchableStyles.touchTarget, styles]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title ?? 'Botón'}
      accessibilityHint={accessibilityHint}>
      {title && <Text style={textStyle}>{title}</Text>}
      {icon && <Icon name={icon} size={iconSize ?? 30} color={iconColor} />}
    </TouchableOpacity>
  );
};

const touchableStyles = StyleSheet.create({
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
  },
});
