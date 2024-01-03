import React from 'react';
import {Text, StyleSheet, TextInput, View, KeyboardType} from 'react-native';
import {appColors, appStyles} from '../../styles/globalStyles';

interface Props {
  label: string;
  name?: string;
  placeholder: string;
  onChangeText?: any;
  value: string;
  errors?: string;
  secureTextEntry: boolean;
  onFocus?: any;
  colorText?: any;
  colorInput?: any;
  placeholderTextColor?: any;
  containerStyles?: any;
  multiline?: boolean;
  keyboardType?: KeyboardType;
  style?: any;
  readonly?: boolean;
}

export const InputForm = ({
  label,
  placeholder,
  onChangeText,
  value,
  secureTextEntry,
  onFocus,
  errors,
  name,
  colorText,
  colorInput,
  placeholderTextColor,
  containerStyles,
  multiline,
  keyboardType,
  style,
  readonly,
}: Props) => {
  return (
    <View style={[styles.container, containerStyles]}>
      <Text style={colorText ? colorText : appStyles.textDark}>{label}</Text>
      <TextInput
        keyboardType={keyboardType ?? 'default'}
        style={[
          styles.input,
          colorInput ? colorInput : global.inputDark,
          style,
        ]}
        placeholder={placeholder}
        onChangeText={text => onChangeText(text, name)}
        value={value}
        placeholderTextColor={placeholderTextColor ?? appColors.opacity}
        secureTextEntry={secureTextEntry}
        onFocus={onFocus}
        multiline={multiline}
        numberOfLines={8}
        textBreakStrategy="highQuality"
        readOnly={readonly}
      />
      <View>
        <Text style={[appStyles.textDanger, styles.textCenter]}>{errors}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
    marginVertical: 5,
  },
  input: {
    height: 50,
  },
  textCenter: {
    textAlign: 'center',
  },
});
