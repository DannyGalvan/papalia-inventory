/** Value types that are safe to bind with every SQLite driver in use. */
export type SqlParam = string | number;

export type SqlRow = Record<string, unknown>;

/** Minimal raw-SQL port (lets repositories be tested against sql.js). */
export interface SqlExecutor {
  query(sql: string, params?: SqlParam[]): Promise<SqlRow[]>;
}

/** A {@link SqlExecutor} able to run several statements atomically. */
export interface TransactionalSqlExecutor extends SqlExecutor {
  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}

/**
 * Same layout TypeORM uses to persist `datetime` columns on SQLite
 * (`YYYY-MM-DD HH:mm:ss.SSS`, UTC), so raw writes hydrate identically.
 */
export const toSqliteUtcDatetime = (date: Date): string =>
  date.toISOString().replace('T', ' ').replace('Z', '');
