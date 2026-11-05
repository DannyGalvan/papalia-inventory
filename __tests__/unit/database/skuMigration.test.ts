import initSqlJs, { Database } from 'sql.js';
import type { QueryRunner } from 'typeorm';
import { AddProductSku1700000000008 } from '../../../src/database/migrations/AddProductSku1700000000008';
import { runSql } from '../../helpers/sqlJsExecutor';

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

beforeAll(async () => {
  SQL = await initSqlJs();
});

const runner = (db: Database): QueryRunner =>
  ({ query: async (sql: string) => db.run(sql) } as unknown as QueryRunner);

const columns = (db: Database) =>
  runSql(db, 'PRAGMA table_info("product")').map(r => r.name);

function seed(): Database {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE "product" ("code" varchar PRIMARY KEY, "name" varchar NOT NULL);
    INSERT INTO "product" VALUES ('A','Café'),('B','Té');
  `);
  return db;
}

describe('AddProductSku1700000000008', () => {
  it('adds an empty SKU to every existing product', async () => {
    const db = seed();
    await new AddProductSku1700000000008().up(runner(db));
    expect(columns(db)).toContain('sku');
    expect(
      runSql(db, 'SELECT "code","sku" FROM "product" ORDER BY "code"'),
    ).toEqual([
      { code: 'A', sku: '' },
      { code: 'B', sku: '' },
    ]);
    db.close();
  });

  it('makes non-empty SKUs unique (case-insensitive) but allows many blanks', async () => {
    const db = seed();
    await new AddProductSku1700000000008().up(runner(db));
    db.run('UPDATE "product" SET "sku" = \'X-1\' WHERE "code" = \'A\'');
    expect(() =>
      db.run('UPDATE "product" SET "sku" = \'x-1\' WHERE "code" = \'B\''),
    ).toThrow(/UNIQUE/);
    db.run(
      "INSERT INTO \"product\" (\"code\",\"name\") VALUES ('C','n'),('D','n')",
    );
    expect(
      runSql(db, 'SELECT COUNT(*) AS n FROM "product" WHERE "sku" = \'\''),
    ).toEqual([{ n: 3 }]);
    db.close();
  });

  it('is idempotent and reversible', async () => {
    const db = seed();
    const migration = new AddProductSku1700000000008();
    await migration.up(runner(db));
    await expect(migration.up(runner(db))).resolves.toBeUndefined();
    await migration.down(runner(db));
    expect(columns(db)).not.toContain('sku');
    expect(runSql(db, 'SELECT COUNT(*) AS n FROM "product"')).toEqual([
      { n: 2 },
    ]);
    db.close();
  });
});
