/**
 * AddProductIsActive / AddMovementCancellation migrations executed against an
 * in-memory SQLite database (sql.js) mirroring the pre-migration schema.
 */

import initSqlJs, { Database } from 'sql.js';
import type { QueryRunner } from 'typeorm';
import { AddMovementCancellation1700000000007 } from '../../../src/database/migrations/AddMovementCancellation1700000000007';
import { AddProductIsActive1700000000006 } from '../../../src/database/migrations/AddProductIsActive1700000000006';
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

const columns = (db: Database, table: string) =>
  runSql(db, `PRAGMA table_info("${table}")`).map(r => r.name);

function seed(): Database {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE "product" ("code" varchar PRIMARY KEY, "name" varchar NOT NULL,
      "stock" integer NOT NULL);
    CREATE TABLE "log_header" ("id" integer PRIMARY KEY AUTOINCREMENT,
      "type" integer NOT NULL, "comments" varchar NOT NULL,
      "createdAt" datetime NOT NULL, "isInput" boolean NOT NULL);
    INSERT INTO "product" VALUES ('A','Café',4),('B','Té',0);
    INSERT INTO "log_header" ("type","comments","createdAt","isInput")
      VALUES (7,'c','2026-01-01 00:00:00.000',1);
  `);
  return db;
}

describe('AddProductIsActive1700000000006', () => {
  it('adds isActive defaulting every existing product to active', async () => {
    const db = seed();
    await new AddProductIsActive1700000000006().up(runner(db));

    expect(columns(db, 'product')).toContain('isActive');
    expect(
      runSql(db, 'SELECT "code","isActive" FROM "product" ORDER BY "code"'),
    ).toEqual([
      { code: 'A', isActive: 1 },
      { code: 'B', isActive: 1 },
    ]);
    db.close();
  });

  it('is idempotent and reversible', async () => {
    const db = seed();
    const migration = new AddProductIsActive1700000000006();
    await migration.up(runner(db));
    await expect(migration.up(runner(db))).resolves.toBeUndefined();
    await migration.down(runner(db));
    expect(columns(db, 'product')).not.toContain('isActive');
    expect(runSql(db, 'SELECT COUNT(*) AS n FROM "product"')).toEqual([
      { n: 2 },
    ]);
    db.close();
  });
});

describe('AddMovementCancellation1700000000007', () => {
  it('adds cancellation columns with safe defaults', async () => {
    const db = seed();
    await new AddMovementCancellation1700000000007().up(runner(db));

    expect(columns(db, 'log_header')).toEqual(
      expect.arrayContaining(['isCancelled', 'cancelledAt', 'cancelReason']),
    );
    expect(
      runSql(
        db,
        'SELECT "isCancelled","cancelledAt","cancelReason" FROM "log_header"',
      ),
    ).toEqual([{ isCancelled: 0, cancelledAt: null, cancelReason: '' }]);
    db.close();
  });

  it('is idempotent and reversible', async () => {
    const db = seed();
    const migration = new AddMovementCancellation1700000000007();
    await migration.up(runner(db));
    await expect(migration.up(runner(db))).resolves.toBeUndefined();
    await migration.down(runner(db));
    expect(columns(db, 'log_header')).not.toEqual(
      expect.arrayContaining(['isCancelled']),
    );
    db.close();
  });
});
