import React from 'react';
import {
    KeyboardType,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { appColors } from '../../styles/globalStyles';

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
  accessibilityLabel?: string;
  accessibilityHint?: string;
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
  accessibilityLabel,
  accessibilityHint,
}: Props) => {
  return (
    <View style={[styles.container, containerStyles]}>
      <Text
        style={[styles.label, colorText]}
        accessibilityRole="text">
        {label}
      </Text>
      <TextInput
        keyboardType={keyboardType ?? 'default'}
        style={[
          styles.input,
          colorInput ? colorInput : styles.inputDefault,
          style,
        ]}
        placeholder={placeholder}
        onChangeText={text => onChangeText(text, name)}
        value={value}
        placeholderTextColor={placeholderTextColor ?? appColors.opacity}
        secureTextEntry={secureTextEntry}
        onFocus={onFocus}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textBreakStrategy="highQuality"
        readOnly={readonly}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint ?? placeholder}
        accessibilityState={{disabled: readonly}}
      />
      {!!errors && (
        <Text
          style={styles.errorText}
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert">
          {errors}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
    marginVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    minHeight: 44,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 4,
    fontSize: 16,
  },
  inputDefault: {
    borderBottomWidth: 1,
    borderColor: appColors.gray,
  },
  errorText: {
    color: appColors.danger,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
});
