import {typeORMDriver} from 'react-native-quick-sqlite';
import {DataSource} from 'typeorm';
import {Product} from '../models/Product';
import {LogHeader} from '../models/LogHeader';
import {LogDetail} from '../models/LogDetail';

export const dataSource = new DataSource({
  database: 'quicksqlitetest-typeorm.db',
  entities: [Product, LogHeader, LogDetail],
  location: '.',
  logging: ['error', 'query'],
  synchronize: true,
  type: 'react-native',
  driver: typeORMDriver,
});
