/**
 * ThemeContext / ThemeProvider for the "liquid" design system.
 *
 * Provides the active resolved `Theme` (light or dark) to the component tree
 * and exposes a `toggleTheme` action. The selected preference is persisted to
 * the existing `configuration` table (key: `theme_preference`, value:
 * `'light'` | `'dark'`) via the `ConfigurationRepository`.
 *
 * Behavior:
 *  - On mount the persisted preference is read and applied before children
 *    are rendered (a lightweight loading screen is shown while reading).
 *  - If no preference exists, or if reading/writing fails, the provider
 *    defaults to the light theme and lets the user continue uninterrupted.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7
 */

import React, {
    createContext,
    ReactNode,
    useEffect,
    useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { KEY_THEME_PREFERENCE } from '../config/constants';
import {
    ConfigurationRepository,
    createConfiguration,
    getConfigurationByKey,
    updateConfiguration,
} from '../database/repository/ConfigurationRepository';
import { darkTheme, lightTheme, Theme } from '../design-system/themes';

export type ThemePreference = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext({} as ThemeContextValue);

const resolveTheme = (preference: ThemePreference): Theme =>
  preference === 'dark' ? darkTheme : lightTheme;

export const ThemeProvider = ({children}: {children: ReactNode}) => {
  // Default to light theme (Requirements 2.5, 2.7).
  const [preference, setPreference] = useState<ThemePreference>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Restore the persisted preference before rendering the first screen
  // (Requirement 2.4). Any failure falls back to the light theme (2.7).
  useEffect(() => {
    (async () => {
      try {
        const config = await getConfigurationByKey(KEY_THEME_PREFERENCE);
        if (config && config.value === 'dark') {
          setPreference('dark');
        } else {
          setPreference('light');
        }
      } catch (error) {
        console.log(error);
        setPreference('light');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist the preference to the configuration table (Requirement 2.2).
  const persistPreference = async (value: ThemePreference) => {
    try {
      const existing = await getConfigurationByKey(KEY_THEME_PREFERENCE);
      const entity = ConfigurationRepository.create({
        key: KEY_THEME_PREFERENCE,
        value,
      });

      if (existing) {
        await updateConfiguration(entity);
      } else {
        await createConfiguration(entity);
      }
    } catch (error) {
      // Persistence failures must not interrupt the user (Requirement 2.7).
      console.log(error);
    }
  };

  // Switch to the alternate theme immediately, then persist (Requirement 2.3).
  const toggleTheme = () => {
    const next: ThemePreference = preference === 'dark' ? 'light' : 'dark';
    setPreference(next);
    persistPreference(next);
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: lightTheme.colors.background,
        }}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  const theme = resolveTheme(preference);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: preference === 'dark',
        toggleTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};
