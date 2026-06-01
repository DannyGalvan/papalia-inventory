import { typeORMDriver } from 'react-native-nitro-sqlite';
import { DataSource } from 'typeorm';
import { NAME_BD } from '../../config/constants';
import { AddDomainEntities1700000000003 } from '../migrations/AddDomainEntities1700000000003';
import { AddTimezonesCatalog1700000000004 } from '../migrations/AddTimezonesCatalog1700000000004';
import { AddMovementTypeCatalog1700000000002 } from '../migrations/AddMovementTypeCatalog1700000000002';
import { InitPapaliaSchema1700000000000 } from '../migrations/InitPapaliaSchema1700000000000';
import { RenameCommetsToComments1700000000001 } from '../migrations/RenameCommetsToComments1700000000001';
import { Category } from '../models/Category';
import { Configuration } from '../models/Configuration';
import { LogDetail } from '../models/LogDetail';
import { LogHeader } from '../models/LogHeader';
import { MovementType } from '../models/MovementType';
import { Product } from '../models/Product';
import { Supplier } from '../models/Supplier';
import { Timezone } from '../models/Timezone';
import { UnitOfMeasure } from '../models/UnitOfMeasure';

export const dataSource = new DataSource({
  database: NAME_BD,
  entities: [LogHeader, LogDetail, Product, Configuration, MovementType, Category, Supplier, UnitOfMeasure, Timezone],
  location: '.',
  logging: __DEV__ ? ['error', 'warn'] : false,
  type: 'react-native',
  driver: typeORMDriver,
  migrationsRun: true,
  migrations: [
    InitPapaliaSchema1700000000000,
    RenameCommetsToComments1700000000001,
    AddMovementTypeCatalog1700000000002,
    AddDomainEntities1700000000003,
    AddTimezonesCatalog1700000000004,
  ],
});

// 'log', 'error', 'warn', 'info', 'query', 'schema', 'log'
