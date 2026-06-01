import { typeORMDriver } from 'react-native-nitro-sqlite';
import { DataSource } from 'typeorm';
import { NAME_BD } from '../../config/constants';
import { AddMovementTypeCatalog1700000000002 } from '../migrations/AddMovementTypeCatalog1700000000002';
import { InitPapaliaSchema1700000000000 } from '../migrations/InitPapaliaSchema1700000000000';
import { RenameCommetsToComments1700000000001 } from '../migrations/RenameCommetsToComments1700000000001';
import { Configuration } from '../models/Configuration';
import { LogDetail } from '../models/LogDetail';
import { LogHeader } from '../models/LogHeader';
import { MovementType } from '../models/MovementType';
import { Product } from '../models/Product';

export const dataSource = new DataSource({
  database: NAME_BD,
  entities: [LogHeader, LogDetail, Product, Configuration, MovementType],
  location: '.',
  logging: __DEV__ ? ['error', 'warn'] : false,
  type: 'react-native',
  driver: typeORMDriver,
  migrationsRun: true,
  migrations: [
    InitPapaliaSchema1700000000000,
    RenameCommetsToComments1700000000001,
    AddMovementTypeCatalog1700000000002,
  ],
});

// 'log', 'error', 'warn', 'info', 'query', 'schema', 'log'
