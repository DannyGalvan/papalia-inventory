/**
 * Toast — themed, non-blocking notification shown at the top of the screen.
 *
 * Behavior:
 *  - Slides in from the top when `visible` becomes true and slides out when it
 *    becomes false.
 *  - Auto-dismisses after `duration` milliseconds (default 3000ms) by invoking
 *    `onDismiss` (Requirement 8.5).
 *  - Positioned at the top of the screen and dismissable early by swiping
 *    up (Requirement 8.8).
 *  - Does not block interaction with the underlying screen: the container uses
 *    `pointerEvents="box-none"` so only the toast surface itself is touchable
 *    (Requirement 8.5).
 *  - Uses the active theme's semantic feedback colors via `useTheme()`.
 *
 * Accessibility (Requirements 4.1, 4.2):
 *  - `accessibilityRole="alert"` so assistive tech treats it as an alert.
 *  - `accessibilityLiveRegion="polite"` so the message is announced.
 *  - A Spanish `accessibilityLabel` prefixes the message with its type.
 *
 * Requirements: 8.5, 8.8, 4.1, 4.2
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
    AccessibilityInfo,
    Animated,
    PanResponder,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
  /** Auto-dismiss delay in milliseconds. Defaults to 3000ms. */
  duration?: number;
}

const DEFAULT_DURATION = 3000;
const ANIMATION_DURATION = 250;
/** Vertical drag distance (px) that triggers an early dismiss. */
const SWIPE_DISMISS_THRESHOLD = 40;
/** Default top inset when SafeAreaProvider is not available. */
const DEFAULT_TOP_INSET = Platform.OS === 'ios' ? 50 : 24;

/** Spanish accessibility prefixes per toast type. */
const ACCESSIBILITY_PREFIX: Record<ToastType, string> = {
  success: 'Éxito',
  error: 'Error',
  warning: 'Advertencia',
};

/**
 * Picks a readable foreground (text) color for the given hex background by
 * comparing WCAG relative luminance. Returns near-white on dark backgrounds
 * and near-black on light backgrounds so the message stays legible across
 * both themes' feedback colors (Requirement 4.5).
 */
const getReadableTextColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map(c => c + c)
          .join('')
      : hex;

  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;

  const toLinear = (channel: number) =>
    channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Threshold ~0.45 favors white on mid-to-dark colors while switching to a
  // dark text on light backgrounds (e.g. the dark theme's yellow warning).
  return luminance > 0.45 ? '#16191D' : '#FFFFFF';
};

export const Toast = ({
  message,
  type,
  visible,
  onDismiss,
  duration = DEFAULT_DURATION,
}: ToastProps) => {
  const {theme} = useTheme();
  const topInset = DEFAULT_TOP_INSET;

  // -translation hides the toast above the top edge; 0 shows it.
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  // Slide/fade the toast out, then notify the parent it can hide it.
  const animateOut = useCallback(
    (notify: boolean) => {
      clearDismissTimer();
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(({finished}) => {
        if (finished && notify) {
          onDismiss();
        }
      });
    },
    [clearDismissTimer, onDismiss, opacity, translateY],
  );

  useEffect(() => {
    if (visible) {
      // Announce the message for assistive technologies (Requirement 4.1/4.2).
      AccessibilityInfo.announceForAccessibility(
        `${ACCESSIBILITY_PREFIX[type]}: ${message}`,
      );

      // Reset position before sliding in (covers re-show after a swipe).
      translateY.setValue(-120);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after `duration` (Requirement 8.5).
      clearDismissTimer();
      dismissTimer.current = setTimeout(() => animateOut(true), duration);
    } else {
      animateOut(false);
    }

    return clearDismissTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, message, type, duration]);

  // Swipe-to-dismiss: follow upward drags and dismiss past the threshold
  // (Requirement 8.8).
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => clearDismissTimer(),
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dy < 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dy < -SWIPE_DISMISS_THRESHOLD) {
          animateOut(true);
        } else {
          // Snap back and restart the auto-dismiss timer.
          Animated.timing(translateY, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }).start();
          clearDismissTimer();
          dismissTimer.current = setTimeout(() => animateOut(true), duration);
        }
      },
    }),
  ).current;

  if (!visible) {
    return null;
  }

  const backgroundColor =
    type === 'success'
      ? theme.colors.successFeedback
      : type === 'error'
      ? theme.colors.errorFeedback
      : theme.colors.warningFeedback;

  const textColor = getReadableTextColor(backgroundColor);

  return (
    <View
      style={[styles.container, {top: topInset + theme.spacing.sm}]}
      pointerEvents="box-none">
      <Animated.View
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${ACCESSIBILITY_PREFIX[type]}: ${message}`}
        style={[
          styles.toast,
          theme.elevation.medium,
          {
            backgroundColor,
            borderRadius: theme.borderRadius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.md,
            transform: [{translateY}],
            opacity,
          },
        ]}>
        <Text
          style={[
            styles.message,
            {
              color: textColor,
              fontSize: theme.typography.body.fontSize,
              fontWeight: theme.typography.body.fontWeight,
              lineHeight: theme.typography.body.lineHeight,
            },
          ]}
          numberOfLines={3}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    minHeight: 44,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
  },
});

export default Toast;
