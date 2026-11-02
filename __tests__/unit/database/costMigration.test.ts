/**
 * AddCostAndProfit migration, executed against an in-memory SQLite database
 * (sql.js) that mirrors the pre-migration schema.
 */

import initSqlJs, { Database } from 'sql.js';
import type { QueryRunner } from 'typeorm';
import { AddCostAndProfit1700000000005 } from '../../../src/database/migrations/AddCostAndProfit1700000000005';

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

const rows = (db: Database, sql: string) => {
  const res = db.exec(sql);
  if (res.length === 0) {
    return [];
  }
  const { columns, values } = res[0];
  return values.map(v => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
};

const columns = (db: Database, table: string) =>
  rows(db, `PRAGMA table_info("${table}")`).map(r => r.name);

function seed(): Database {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE "product" ("code" varchar PRIMARY KEY, "name" varchar NOT NULL,
      "description" varchar NOT NULL, "price" decimal NOT NULL,
      "stock" integer NOT NULL, "image" varchar NOT NULL DEFAULT '');
    CREATE TABLE "log_detail" ("id" integer PRIMARY KEY AUTOINCREMENT,
      "productCode" varchar NOT NULL, "logHeaderId" integer NOT NULL,
      "name" varchar NOT NULL, "quantity" integer NOT NULL,
      "price" decimal NOT NULL, "total" decimal NOT NULL);
    CREATE TABLE "movement_type" ("id" integer PRIMARY KEY AUTOINCREMENT,
      "name" varchar NOT NULL, "isInput" boolean NOT NULL,
      "isActive" boolean NOT NULL DEFAULT 1);
    INSERT INTO "product" VALUES ('A','Café','desc',10.5,4,'');
    INSERT INTO "log_detail" ("productCode","logHeaderId","name","quantity","price","total")
      VALUES ('A',1,'Café',2,10.5,21);
    INSERT INTO "movement_type" ("id","name","isInput","isActive") VALUES
      (1,'Venta',0,1),(2,'Extraordinaria',0,1),(7,'Compra de inventario',1,1);
  `);
  return db;
}

describe('AddCostAndProfit1700000000005', () => {
  it('adds the cost columns and flags the Venta type as sale', async () => {
    const db = seed();
    await new AddCostAndProfit1700000000005().up(runner(db));

    expect(columns(db, 'product')).toContain('cost');
    expect(columns(db, 'log_detail')).toContain('unitCost');
    expect(columns(db, 'movement_type')).toContain('isSale');

    expect(
      rows(db, 'SELECT "code","price","stock","cost" FROM "product"'),
    ).toEqual([{ code: 'A', price: 10.5, stock: 4, cost: 0 }]);
    expect(rows(db, 'SELECT "total","unitCost" FROM "log_detail"')).toEqual([
      { total: 21, unitCost: null },
    ]);
    expect(
      rows(db, 'SELECT "id","isSale" FROM "movement_type" ORDER BY "id"'),
    ).toEqual([
      { id: 1, isSale: 1 },
      { id: 2, isSale: 0 },
      { id: 7, isSale: 0 },
    ]);
    db.close();
  });

  it('is idempotent when re-run', async () => {
    const db = seed();
    const migration = new AddCostAndProfit1700000000005();
    await migration.up(runner(db));
    await expect(migration.up(runner(db))).resolves.toBeUndefined();
    expect(columns(db, 'product').filter(c => c === 'cost')).toHaveLength(1);
    db.close();
  });
});
