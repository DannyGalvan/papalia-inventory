/**
 * Root application component.
 *
 * Initialization order:
 *  1. Database is initialized first (required before any repository access)
 *  2. ErrorBoundary wraps everything (catches unhandled JS errors)
 *  3. ThemeProvider reads persisted preference from DB (now safe)
 *  4. NavigationContainer + app screens render
 *
 * @format
 */

import { NavigationContainer } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ErrorBoundary } from './src/components/feedback/ErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';
import { dataSource } from './src/database/connection/DataSource';
import { useTheme } from './src/hooks/useTheme';
import { logService } from './src/services/LogService';
import AppStartStack from './src/stacks/AppStartStack';

type DbState = 'loading' | 'ready' | 'error';

/**
 * Inner app content rendered after DB + Theme are ready.
 */
function AppContent(): React.JSX.Element {
  const {theme} = useTheme();

  return (
    <View style={[styles.flex, {backgroundColor: theme.colors.background}]}>
      <NavigationContainer>
        <AppStartStack />
      </NavigationContainer>
    </View>
  );
}

/**
 * Root App component.
 *
 * Initializes the database FIRST, then renders ThemeProvider (which needs
 * the DB to read the persisted theme preference). This avoids the
 * "EntityMetadataNotFoundError" race condition.
 */
function App(): React.JSX.Element {
  const [dbState, setDbState] = useState<DbState>('loading');

  const initializeDatabase = useCallback(async () => {
    setDbState('loading');
    try {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
        console.log('Data Source has been initialized!');
      }
      setDbState('ready');
    } catch (error) {
      logService.logError({
        errorType: error instanceof Error ? error.name : 'DatabaseError',
        source: 'App',
        operation: 'initializeDatabase',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
      setDbState('error');
    }
  }, []);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  // Loading state — simple spinner (no theme available yet since DB not ready)
  if (dbState === 'loading') {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>
          Iniciando la aplicación...
        </Text>
      </View>
    );
  }

  // Error state — retry screen in Spanish (Requirements 10.3, 10.4)
  if (dbState === 'error') {
    return (
      <View
        style={styles.centeredContainer}
        accessible
        accessibilityRole="alert"
        accessibilityLabel="Error al iniciar la base de datos. Presione reintentar para intentar de nuevo.">
        <Text style={styles.errorTitle} accessibilityRole="header">
          Error de Base de Datos
        </Text>
        <Text style={styles.errorDescription}>
          No se pudo iniciar la base de datos. Verifique que el dispositivo
          tenga espacio disponible e intente de nuevo.
        </Text>
        <TouchableOpacity
          onPress={initializeDatabase}
          accessibilityRole="button"
          accessibilityLabel="Reintentar inicialización de base de datos"
          style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // DB ready — now safe to render ThemeProvider (it reads from DB)
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1565C0',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default App;
