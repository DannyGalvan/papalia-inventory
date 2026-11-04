/**
 * MovementCancellationService + SqlMovementCancellationStore executed against
 * an in-memory SQLite database (sql.js) with the post-migration schema, so
 * the real SQL, the transaction and the rollback paths are exercised.
 */

import initSqlJs, { Database } from 'sql.js';
import { SqlMovementCancellationStore } from '../../../../src/database/repository/SqlMovementCancellationStore';
import { MovementCancellationService } from '../../../../src/services/movement/MovementCancellationService';
import { isCancelRejection } from '../../../../src/services/movement/types';
import { createSqlJsExecutor, runSql } from '../../../helpers/sqlJsExecutor';

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

beforeAll(async () => {
  SQL = await initSqlJs();
});

const NOW = new Date('2026-11-04T15:30:00.123Z');

function seed(): Database {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE "product" ("code" varchar PRIMARY KEY, "name" varchar NOT NULL,
      "stock" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT 1);
    CREATE TABLE "log_header" ("id" integer PRIMARY KEY AUTOINCREMENT,
      "type" integer NOT NULL, "comments" varchar NOT NULL,
      "createdAt" datetime NOT NULL, "isInput" boolean NOT NULL,
      "isCancelled" boolean NOT NULL DEFAULT 0,
      "cancelledAt" datetime DEFAULT NULL,
      "cancelReason" varchar NOT NULL DEFAULT '');
    CREATE TABLE "log_detail" ("id" integer PRIMARY KEY AUTOINCREMENT,
      "productCode" varchar NOT NULL, "logHeaderId" integer NOT NULL,
      "name" varchar NOT NULL, "quantity" integer NOT NULL);

    INSERT INTO "product" VALUES ('A','Café',10,1),('B','Azúcar',3,1);
    -- 1: input of 5 A + 2 B (fully reversible)
    INSERT INTO "log_header" ("id","type","comments","createdAt","isInput")
      VALUES (1,7,'compra','2026-11-01 10:00:00.000',1);
    INSERT INTO "log_detail" ("productCode","logHeaderId","name","quantity")
      VALUES ('A',1,'Café',5),('B',1,'Azúcar',2);
    -- 2: output of 4 A
    INSERT INTO "log_header" ("id","type","comments","createdAt","isInput")
      VALUES (2,1,'venta','2026-11-02 10:00:00.000',0);
    INSERT INTO "log_detail" ("productCode","logHeaderId","name","quantity")
      VALUES ('A',2,'Café',4);
    -- 3: input of 9 B (B now has 3 → cannot be reverted)
    INSERT INTO "log_header" ("id","type","comments","createdAt","isInput")
      VALUES (3,7,'compra','2026-11-03 10:00:00.000',1);
    INSERT INTO "log_detail" ("productCode","logHeaderId","name","quantity")
      VALUES ('A',3,'Café',1),('B',3,'Azúcar',9);
  `);
  return db;
}

const stocks = (db: Database) =>
  Object.fromEntries(
    runSql(db, 'SELECT "code","stock" FROM "product" ORDER BY "code"').map(
      r => [r.code, r.stock],
    ),
  );

const header = (db: Database, id: number) =>
  runSql(
    db,
    'SELECT "isCancelled","cancelledAt","cancelReason" FROM "log_header" WHERE "id" = ?',
    [id],
  )[0];

const createService = (db: Database, failOn?: string) =>
  new MovementCancellationService(
    new SqlMovementCancellationStore(
      createSqlJsExecutor(db, {
        beforeQuery: sql => {
          if (failOn && sql.includes(failOn)) {
            throw new Error('disk I/O error');
          }
        },
      }),
    ),
    () => NOW,
  );

describe('Movement cancellation (sql.js)', () => {
  it('cancels an input: subtracts stock and records date and reason', async () => {
    const db = seed();
    const result = await createService(db).cancel(1, '  Captura   duplicada ');

    expect(result.ok).toBe(true);
    expect(stocks(db)).toEqual({ A: 5, B: 1 });
    expect(header(db, 1)).toEqual({
      isCancelled: 1,
      cancelledAt: '2026-11-04 15:30:00.123',
      cancelReason: 'Captura duplicada',
    });
    db.close();
  });

  it('cancels an output: returns the stock to inventory', async () => {
    const db = seed();
    const result = await createService(db).cancel(2, 'Venta no realizada');
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Salida cancelada/);
    expect(stocks(db)).toEqual({ A: 14, B: 3 });
    db.close();
  });

  it('blocks an input whose reversal would leave negative stock', async () => {
    const db = seed();
    const result = await createService(db).cancel(3, 'Error de captura');

    expect(isCancelRejection(result) && result.failure).toBe('negative_stock');
    expect(isCancelRejection(result) && result.violations).toEqual([
      { productCode: 'B', name: 'Azúcar', currentStock: 3, resultingStock: -6 },
    ]);
    expect(result.message).toMatch(/Azúcar/);
    // Nothing changed — not even product A, which could have been reverted.
    expect(stocks(db)).toEqual({ A: 10, B: 3 });
    expect(header(db, 3).isCancelled).toBe(0);
    db.close();
  });

  it('refuses to cancel twice', async () => {
    const db = seed();
    const service = createService(db);
    await service.cancel(2, 'Venta no realizada');
    const second = await service.cancel(2, 'Venta no realizada');

    expect(isCancelRejection(second) && second.failure).toBe(
      'already_cancelled',
    );
    expect(stocks(db)).toEqual({ A: 14, B: 3 });
    db.close();
  });

  it('reports a missing movement', async () => {
    const db = seed();
    const result = await createService(db).cancel(99, 'No existe aquí');
    expect(isCancelRejection(result) && result.failure).toBe('not_found');
    db.close();
  });

  it('validates the reason before touching the database', async () => {
    const db = seed();
    const result = await createService(db).cancel(1, 'no');
    expect(isCancelRejection(result) && result.failure).toBe('invalid_reason');
    expect(stocks(db)).toEqual({ A: 10, B: 3 });
    db.close();
  });

  it('rolls back every stock change when a later statement fails', async () => {
    const db = seed();
    const result = await createService(db, 'UPDATE "log_header"').cancel(
      1,
      'Captura duplicada',
    );

    expect(isCancelRejection(result) && result.failure).toBe('unknown');
    expect(result.message).toMatch(/disk I\/O error/);
    expect(stocks(db)).toEqual({ A: 10, B: 3 });
    expect(header(db, 1).isCancelled).toBe(0);
    db.close();
  });
});
