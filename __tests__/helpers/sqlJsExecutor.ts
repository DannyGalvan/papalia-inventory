import type { Database } from 'sql.js';
import type {
  SqlExecutor,
  SqlParam,
  SqlRow,
  TransactionalSqlExecutor,
} from '../../src/database/utils/sqlExecutor';

/** Run a statement on sql.js and return rows as plain objects. */
export const runSql = (
  db: Database,
  sql: string,
  params: SqlParam[] = [],
): SqlRow[] => {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows: SqlRow[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as SqlRow);
    }
    return rows;
  } finally {
    stmt.free();
  }
};

/**
 * {@link TransactionalSqlExecutor} over an in-memory sql.js database, so
 * repositories run their real SQL (including rollback) under Jest.
 */
export const createSqlJsExecutor = (
  db: Database,
  hooks: { beforeQuery?: (sql: string) => void } = {},
): TransactionalSqlExecutor => {
  const query: SqlExecutor['query'] = async (sql, params) => {
    hooks.beforeQuery?.(sql);
    return runSql(db, sql, params);
  };
  return {
    query,
    transaction: async work => {
      db.run('BEGIN TRANSACTION');
      try {
        const result = await work({ query });
        db.run('COMMIT');
        return result;
      } catch (error) {
        db.run('ROLLBACK');
        throw error;
      }
    },
  };
};
