import {dataSource} from '../connection/DataSource';
import {LogDetail} from '../models/LogDetail';

export const LogDetailRepository = dataSource.getRepository(LogDetail);
