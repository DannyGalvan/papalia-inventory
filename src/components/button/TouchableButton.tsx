import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {appStyles} from '../../styles/globalStyles';

interface Props {
  styles: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  onPress: () => void;
  title?: string;
  iconColor?: string;
  icon?: string;
  iconSize?: number;
}

export const TouchableButton = ({
  styles,
  icon,
  onPress,
  textStyle,
  title,
  iconColor,
  iconSize,
}: Props) => {
  return (
    <TouchableOpacity
      style={[appStyles.button, styles]}
      onPress={onPress}
      accessibilityLabel={title}>
      {title && <Text style={textStyle}>{title}</Text>}
      {icon && <Icon name={icon} size={iconSize ?? 30} color={iconColor} />}
    </TouchableOpacity>
  );
};
