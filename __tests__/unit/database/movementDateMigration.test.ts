/**
 * AddMovementDate migration executed against an in-memory SQLite database
 * (sql.js) mirroring the pre-migration log_header schema.
 */

import initSqlJs, { Database } from 'sql.js';
import type { QueryRunner } from 'typeorm';
import { AddMovementDate1700000000009 } from '../../../src/database/migrations/AddMovementDate1700000000009';
import { runSql } from '../../helpers/sqlJsExecutor';

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

beforeAll(async () => {
  SQL = await initSqlJs();
});

const runner = (db: Database): QueryRunner =>
  ({
    query: async (sql: string) => {
      db.run(sql);
    },
  } as unknown as QueryRunner);

const columns = (db: Database) =>
  runSql(db, 'PRAGMA table_info("log_header")').map(r => r.name);

const indexes = (db: Database) =>
  runSql(db, 'PRAGMA index_list("log_header")').map(r => r.name);

function seed(): Database {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE "log_header" ("id" integer PRIMARY KEY AUTOINCREMENT,
      "type" integer NOT NULL, "comments" varchar NOT NULL,
      "createdAt" datetime NOT NULL, "isInput" boolean NOT NULL,
      "isCancelled" boolean NOT NULL DEFAULT 0);
    INSERT INTO "log_header" ("type","comments","createdAt","isInput")
      VALUES (1,'venta','2026-01-01 10:00:00.000',0),
             (7,'compra','2026-02-15 18:30:00.000',1);
  `);
  return db;
}

describe('AddMovementDate1700000000009', () => {
  it('adds movementDate backfilled with each row createdAt', async () => {
    const db = seed();
    await new AddMovementDate1700000000009().up(runner(db));

    expect(columns(db)).toContain('movementDate');
    expect(
      runSql(
        db,
        'SELECT "createdAt","movementDate" FROM "log_header" ORDER BY "id"',
      ),
    ).toEqual([
      {
        createdAt: '2026-01-01 10:00:00.000',
        movementDate: '2026-01-01 10:00:00.000',
      },
      {
        createdAt: '2026-02-15 18:30:00.000',
        movementDate: '2026-02-15 18:30:00.000',
      },
    ]);
    expect(indexes(db)).toContain('IDX_log_header_movementDate');
    db.close();
  });

  it('is idempotent and does not overwrite chosen movement dates', async () => {
    const db = seed();
    const migration = new AddMovementDate1700000000009();
    await migration.up(runner(db));
    db.run(
      `UPDATE "log_header" SET "movementDate" = '2025-12-31 09:00:00.000' WHERE "id" = 1`,
    );
    await expect(migration.up(runner(db))).resolves.toBeUndefined();

    expect(
      runSql(db, 'SELECT "movementDate" FROM "log_header" WHERE "id" = 1'),
    ).toEqual([{ movementDate: '2025-12-31 09:00:00.000' }]);
    db.close();
  });

  it('is reversible', async () => {
    const db = seed();
    const migration = new AddMovementDate1700000000009();
    await migration.up(runner(db));
    await migration.down(runner(db));

    expect(columns(db)).not.toContain('movementDate');
    expect(indexes(db)).not.toContain('IDX_log_header_movementDate');
    expect(runSql(db, 'SELECT COUNT(*) AS n FROM "log_header"')).toEqual([
      { n: 2 },
    ]);
    db.close();
  });
});
