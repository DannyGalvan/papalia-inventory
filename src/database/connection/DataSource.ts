import { typeORMDriver } from 'react-native-nitro-sqlite';
import { DataSource } from 'typeorm';
import { Product } from '../models/Product';
import { LogHeader } from '../models/LogHeader';
import { LogDetail } from '../models/LogDetail';
import { NAME_BD } from '../../config/constants';
import { Configuration } from '../models/Configuration';
import { InitPapaliaSchema1700000000000 } from '../migrations/InitPapaliaSchema1700000000000';

export const dataSource = new DataSource({
  database: NAME_BD,
  entities: [LogHeader, LogDetail, Product, Configuration],
  location: '.',
  logging: ['log', 'error', 'warn', 'info', 'query', 'schema', 'log'],
  logger: 'advanced-console',
  type: 'react-native',
  driver: typeORMDriver,
  migrationsRun: true,
  migrations: [InitPapaliaSchema1700000000000],
});

// 'log', 'error', 'warn', 'info', 'query', 'schema', 'log'
