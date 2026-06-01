/**
 * SkeletonLoader — themed loading placeholders for list/dashboard screens.
 *
 * Renders placeholder blocks whose arrangement mirrors the layout of the
 * content that is about to load, instead of a plain ActivityIndicator. This
 * is used on list screens (ProductListScreen, InputListScreen,
 * OutputListScreen, DashboardInputScreen, DashboardOutputScreen) during data
 * fetches.
 *
 * Supported layouts:
 *  - `product-list` — mirrors `ProductItem` (code/name rows, description, image)
 *  - `log-list`     — mirrors `LogItems` (type row + comments block)
 *  - `dashboard`    — mirrors `DashboardItem` (three label/value rows)
 *
 * Placeholder colors are taken from the active theme via `useTheme()` so the
 * skeleton blends with both light and dark themes. A subtle opacity pulse is
 * driven by the native Animated driver to communicate ongoing activity.
 *
 * Requirements: 8.2
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    DimensionValue,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface SkeletonLoaderProps {
  layout: 'product-list' | 'log-list' | 'dashboard';
  count?: number;
}

/** Default number of placeholder cards rendered per layout. */
const DEFAULT_COUNT = 6;

/**
 * A single animated placeholder block. Width/height/borderRadius are supplied
 * by the caller; the fill color and pulse opacity come from the shared theme
 * and animation value.
 */
const SkeletonBlock = ({
  width,
  height,
  color,
  opacity,
  radius,
  style,
}: {
  width: DimensionValue;
  height: DimensionValue;
  color: string;
  opacity: Animated.AnimatedInterpolation<number>;
  radius: number;
  style?: ViewStyle;
}) => (
  <Animated.View
    style={[
      {
        width,
        height,
        borderRadius: radius,
        backgroundColor: color,
        opacity,
      },
      style,
    ]}
  />
);

export const SkeletonLoader = ({layout, count}: SkeletonLoaderProps) => {
  const {theme} = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  // Resolve how many placeholder cards to render. Guard against invalid
  // counts (zero / negative / non-finite) by falling back to the default.
  const itemCount = useMemo(() => {
    if (count === undefined || !Number.isFinite(count) || count <= 0) {
      return DEFAULT_COUNT;
    }
    return Math.floor(count);
  }, [count]);

  // Continuous opacity pulse driven natively (Requirement 8.2 — animated
  // loading state). Runs for the lifetime of the component.
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  // The surface acts as the card background; placeholder blocks use the muted
  // border color so they read as "empty" content slots in both themes.
  const cardColor = theme.colors.surface;
  const blockColor = theme.colors.border;

  const cardBaseStyle: ViewStyle = {
    backgroundColor: cardColor,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
    ...theme.elevation.low,
  };

  const renderCard = (key: number) => {
    switch (layout) {
      case 'product-list':
        return (
          <View key={key} style={cardBaseStyle}>
            <View style={styles.row}>
              <SkeletonBlock
                width="38%"
                height={16}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
              <SkeletonBlock
                width="55%"
                height={16}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
            </View>
            <SkeletonBlock
              width="70%"
              height={14}
              color={blockColor}
              opacity={opacity}
              radius={theme.borderRadius.sm}
              style={{marginTop: theme.spacing.sm}}
            />
            <SkeletonBlock
              width="100%"
              height={120}
              color={blockColor}
              opacity={opacity}
              radius={theme.borderRadius.md}
              style={{marginTop: theme.spacing.sm}}
            />
          </View>
        );

      case 'log-list':
        return (
          <View key={key} style={cardBaseStyle}>
            <View style={styles.row}>
              <SkeletonBlock
                width="30%"
                height={16}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
              <SkeletonBlock
                width="45%"
                height={16}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
            </View>
            <SkeletonBlock
              width="40%"
              height={14}
              color={blockColor}
              opacity={opacity}
              radius={theme.borderRadius.sm}
              style={{marginTop: theme.spacing.sm}}
            />
            <SkeletonBlock
              width="90%"
              height={12}
              color={blockColor}
              opacity={opacity}
              radius={theme.borderRadius.sm}
              style={{marginTop: theme.spacing.xs}}
            />
          </View>
        );

      case 'dashboard':
        return (
          <View key={key} style={cardBaseStyle}>
            <View style={styles.row}>
              <SkeletonBlock
                width="45%"
                height={14}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
              <SkeletonBlock
                width="25%"
                height={14}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
            </View>
            <View style={[styles.row, {marginTop: theme.spacing.sm}]}>
              <SkeletonBlock
                width="35%"
                height={14}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
              <SkeletonBlock
                width="30%"
                height={14}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
            </View>
            <View style={[styles.row, {marginTop: theme.spacing.sm}]}>
              <SkeletonBlock
                width="40%"
                height={14}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
              <SkeletonBlock
                width="20%"
                height={14}
                color={blockColor}
                opacity={opacity}
                radius={theme.borderRadius.sm}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando contenido"
      accessibilityState={{busy: true}}>
      {Array.from({length: itemCount}, (_, index) => renderCard(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default SkeletonLoader;
