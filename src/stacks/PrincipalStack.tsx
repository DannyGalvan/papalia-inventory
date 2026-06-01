import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import InputStack from './InputStack';
import OutputStack from './OutputStack';
import ProductStack from './ProductStack';

const Tab = createMaterialTopTabNavigator();

// ---------------------------------------------------------------------------
// iOS: Custom animated tab navigator (avoids react-native-pager-view freeze)
// ---------------------------------------------------------------------------

const TABS = [
  {key: 'Productos', label: 'Productos', Component: ProductStack},
  {key: 'Entradas', label: 'Entradas', Component: InputStack},
  {key: 'Salidas', label: 'Salidas', Component: OutputStack},
];

const ANIMATION_DURATION = 250;

const IOSPrincipalStack = () => {
  const {theme} = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [tabWidth, setTabWidth] = useState(0);

  // Animated values for the slide transition and indicator position
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width / TABS.length;
    setTabWidth(width);
  };

  const switchTab = (index: number) => {
    if (index === activeTab) {
      return;
    }

    const direction = index > activeTab ? -1 : 1;

    setActiveTab(index);

    // Animate indicator
    Animated.timing(indicatorX, {
      toValue: index * tabWidth,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();

    // Animate content: slide out old, slide in new
    translateX.setValue(direction * -300);
    Animated.timing(translateX, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const ActiveComponent = TABS[activeTab].Component;

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View
        style={[styles.tabBar, {backgroundColor: theme.colors.surface}]}
        onLayout={onTabBarLayout}>
        {TABS.map((tab, index) => {
          const isActive = index === activeTab;
          return (
            <Pressable
              key={tab.key}
              style={styles.tabItem}
              onPress={() => switchTab(index)}
              accessibilityRole="tab"
              accessibilityState={{selected: isActive}}
              accessibilityLabel={tab.label}>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive
                      ? theme.colors.secondary
                      : theme.colors.textSecondary,
                    fontWeight: isActive ? '700' : theme.typography.caption.fontWeight,
                    fontSize: theme.typography.caption.fontSize,
                  },
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        {/* Animated indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth,
                backgroundColor: theme.colors.secondary,
                transform: [{translateX: indicatorX}],
              },
            ]}
          />
        )}
      </View>
      {/* Animated content */}
      <Animated.View
        style={[styles.content, {transform: [{translateX}]}]}>
        <ActiveComponent />
      </Animated.View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Android: Standard material top tab navigator (pager-view works fine)
// ---------------------------------------------------------------------------

const AndroidPrincipalStack = () => {
  const {theme} = useTheme();

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: theme.typography.caption.fontSize,
          fontWeight: theme.typography.caption.fontWeight,
        },
        tabBarStyle: {backgroundColor: theme.colors.surface},
        tabBarIndicatorStyle: {backgroundColor: theme.colors.secondary},
      }}>
      <Tab.Screen name="Productos" component={ProductStack} />
      <Tab.Screen name="Entradas" component={InputStack} />
      <Tab.Screen name="Salidas" component={OutputStack} />
    </Tab.Navigator>
  );
};

// ---------------------------------------------------------------------------
// Export platform-specific navigator
// ---------------------------------------------------------------------------

const PrincipalStack =
  Platform.OS === 'ios' ? IOSPrincipalStack : AndroidPrincipalStack;

export default PrincipalStack;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    textTransform: 'uppercase',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
  },
});
