import {
  SqlExecutor,
  SqlRow,
  TransactionalSqlExecutor,
} from '../utils/sqlExecutor';
import { dataSource } from './DataSource';

// SELECTs return an array of rows; write statements return ids/undefined.
const toRows = (result: unknown): SqlRow[] =>
  Array.isArray(result) ? (result as SqlRow[]) : [];

/** {@link TransactionalSqlExecutor} backed by the app's TypeORM DataSource. */
export const typeormSqlExecutor: TransactionalSqlExecutor = {
  query: async (sql, params) => toRows(await dataSource.query(sql, params)),
  transaction: work =>
    dataSource.transaction(manager => {
      const tx: SqlExecutor = {
        query: async (sql, params) => toRows(await manager.query(sql, params)),
      };
      return work(tx);
    }),
};
