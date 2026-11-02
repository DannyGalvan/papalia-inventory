import React, { forwardRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface Props extends ScrollViewProps {
  /** Style of the outer container (background, flex…). */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Scroll container for forms that keeps the focused input visible above the
 * keyboard.
 *
 * - iOS: the native ScrollView adjusts its bottom inset to the keyboard's real
 *   position (headers and tab bars included) and scrolls the focused
 *   TextInput into view (`automaticallyAdjustKeyboardInsets`). No
 *   KeyboardAvoidingView is used, so there are no hard-coded header offsets.
 * - Android: with targetSdk 35+ the system no longer resizes the window
 *   (edge-to-edge), so a KeyboardAvoidingView pads the screen by the keyboard
 *   overlap; the native ScrollView then keeps the focused field visible. On
 *   older Android versions the window is resized and the padding is 0.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, Props>(
  (
    {
      containerStyle,
      children,
      keyboardShouldPersistTaps = 'handled',
      keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
      style,
      ...scrollProps
    },
    ref,
  ) => {
    const scroll = (
      <ScrollView
        ref={ref}
        style={[styles.flex, style]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        automaticallyAdjustKeyboardInsets
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );

    if (Platform.OS === 'ios') {
      return <View style={[styles.flex, containerStyle]}>{scroll}</View>;
    }

    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.flex, containerStyle]}
      >
        {scroll}
      </KeyboardAvoidingView>
    );
  },
);

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
