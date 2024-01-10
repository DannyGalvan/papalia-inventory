import {typeORMDriver} from 'react-native-quick-sqlite';
import {DataSource} from 'typeorm';
import {Product} from '../models/Product';
import {LogHeader} from '../models/LogHeader';
import {LogDetail} from '../models/LogDetail';
import {NAME_BD} from '../../config/constants';
import {Configuration} from '../models/Configuration';

export const dataSource = new DataSource({
  database: NAME_BD,
  entities: [Product, LogHeader, LogDetail, Configuration],
  location: '.',
  logging: [],
  synchronize: true,
  type: 'react-native',
  driver: typeORMDriver,
});
