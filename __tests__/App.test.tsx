/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// The real DataSource loads react-native-nitro-sqlite, a native module that
// is unavailable under Jest. Keep initialization pending so App renders its
// loading state without touching the database or navigation stack.
jest.mock('../src/database/connection/DataSource', () => ({
  dataSource: {
    isInitialized: false,
    initialize: jest.fn(() => new Promise(() => {})),
  },
}));

jest.mock('../src/database/repository/ConfigurationRepository', () => ({
  ConfigurationRepository: {},
  getAllConfigurations: jest.fn(async () => []),
  getConfigurationByKey: jest.fn(async () => null),
  createConfiguration: jest.fn(),
  upsertConfiguration: jest.fn(),
  updateConfiguration: jest.fn(),
}));

jest.mock('../src/services/LogService', () => ({
  logService: {
    logError: jest.fn(),
    logWarning: jest.fn(),
    logInfo: jest.fn(),
  },
}));

jest.mock('../src/stacks/AppStartStack', () => () => null);

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
