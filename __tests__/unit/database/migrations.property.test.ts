/**
 * Property-based tests for the `commets` -> `comments` column rename migration.
 *
 * Feature: app-modernization
 *   Property 6: Database migration preserves comment data — for any string
 *               value stored in the LogHeader "commets" column before
 *               migration, after running the RenameCommetsToComments migration,
 *               querying the "comments" column must return the identical string
 *               value.
 *
 * Validates: Requirements 7.2
 *
 * Approach for Property 6
 * -----------------------
 * This test exercises the migration against a REAL SQLite engine using `sql.js`
 * (a pure WebAssembly/JS build of SQLite — no native build steps required, so it
 * runs cleanly in the Jest/Node environment). The same SQLite `ALTER TABLE ...
 * RENAME COLUMN` semantics the app relies on at runtime (via
 * `react-native-nitro-sqlite`) are therefore validated here.
 *
 * Rather than re-typing the migration SQL, the test drives the ACTUAL migration
 * class `RenameCommetsToComments1700000000001` by adapting its TypeORM
 * `QueryRunner.query()` calls onto the sql.js database. This guarantees the
 * production migration statement is the one under test.
 */

import fc from 'fast-check';
import initSqlJs, { Database } from 'sql.js';
import type { QueryRunner } from 'typeorm';
import { RenameCommetsToComments1700000000001 } from '../../../src/database/migrations/RenameCommetsToComments1700000000001';

// sql.js needs its wasm runtime initialized once; reused across all cases.
let SQL: Awaited<ReturnType<typeof initSqlJs>>;

beforeAll(async () => {
  SQL = await initSqlJs();
});

/**
 * Minimal {@link QueryRunner} adapter backed by a sql.js `Database`. Only the
 * `query` method used by the migration is implemented; everything else is
 * intentionally absent because the migration never touches it.
 */
function makeQueryRunner(db: Database): QueryRunner {
  return {
    query: async (sql: string, parameters?: unknown[]) => {
      const stmt = db.prepare(sql);
      try {
        if (parameters && parameters.length > 0) {
          stmt.bind(parameters as never[]);
        }
        const rows: unknown[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        return rows;
      } finally {
        stmt.free();
      }
    },
  } as unknown as QueryRunner;
}

/**
 * Create a fresh in-memory `log_header` table (pre-migration schema, with the
 * misspelled `commets` column) and seed it with the provided comment values.
 * Returns the open database; callers are responsible for closing it.
 */
function seedDatabase(comments: string[]): Database {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE "log_header" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "type" integer NOT NULL,
      "commets" varchar NOT NULL,
      "createdAt" datetime NOT NULL,
      "isInput" boolean NOT NULL
    )
  `);

  const insert = db.prepare(
    `INSERT INTO "log_header" ("type", "commets", "createdAt", "isInput")
     VALUES (?, ?, ?, ?)`,
  );
  try {
    comments.forEach((comment, index) => {
      insert.run([index % 2, comment, new Date(0).toISOString(), index % 2]);
    });
  } finally {
    insert.free();
  }

  return db;
}

/** Read every value from a column in insertion (id) order. */
function readColumn(db: Database, column: string): string[] {
  const stmt = db.prepare(
    `SELECT "${column}" AS value FROM "log_header" ORDER BY "id" ASC`,
  );
  const values: string[] = [];
  try {
    while (stmt.step()) {
      values.push(stmt.getAsObject().value as string);
    }
  } finally {
    stmt.free();
  }
  return values;
}

/**
 * Return the set of column names currently defined on `log_header`.
 *
 * Schema introspection (rather than a failing SELECT) is used to assert the
 * rename, because SQLite treats a double-quoted identifier that matches no
 * column as a string literal — so `SELECT "commets"` would not throw even after
 * the column is gone. `PRAGMA table_info` reflects the real schema.
 */
function columnNames(db: Database): string[] {
  const stmt = db.prepare('PRAGMA table_info("log_header")');
  const names: string[] = [];
  try {
    while (stmt.step()) {
      names.push(stmt.getAsObject().name as string);
    }
  } finally {
    stmt.free();
  }
  return names;
}

// ---------------------------------------------------------------------------
// Anchor unit tests (concrete examples)
// ---------------------------------------------------------------------------

describe('RenameCommetsToComments migration — example cases', () => {
  it('renames the column and preserves a simple value', async () => {
    const db = seedDatabase(['Compra de inventario de bodega']);
    const migration = new RenameCommetsToComments1700000000001();

    await migration.up(makeQueryRunner(db));

    // The new column exists and carries the original value...
    expect(readColumn(db, 'comments')).toEqual([
      'Compra de inventario de bodega',
    ]);
    // ...and the old misspelled column no longer exists in the schema.
    expect(columnNames(db)).toContain('comments');
    expect(columnNames(db)).not.toContain('commets');

    db.close();
  });

  it('preserves values containing quotes, accents and unicode', async () => {
    const values = [
      'Devolución del proveedor "Acme"',
      "Regalo para jefes — año's fin",
      '日本語のコメント',
      '',
    ];
    const db = seedDatabase(values);
    const migration = new RenameCommetsToComments1700000000001();

    await migration.up(makeQueryRunner(db));

    expect(readColumn(db, 'comments')).toEqual(values);
    db.close();
  });

  it('down() reverses the rename', async () => {
    const db = seedDatabase(['valor original']);
    const migration = new RenameCommetsToComments1700000000001();

    await migration.up(makeQueryRunner(db));
    await migration.down(makeQueryRunner(db));

    // After reverting, the original misspelled column holds the value again.
    expect(readColumn(db, 'commets')).toEqual(['valor original']);
    expect(columnNames(db)).toContain('commets');
    expect(columnNames(db)).not.toContain('comments');
    db.close();
  });
});

// ---------------------------------------------------------------------------
// Property 6: Database migration preserves comment data
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 6: Database migration preserves comment data', () => {
  it('after migration the "comments" column returns the identical values stored in "commets"', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Any list of arbitrary strings — including empty strings, quotes,
        // accents, emoji and other unicode — stored in the "commets" column.
        fc.array(fc.string(), {minLength: 1, maxLength: 25}),
        async comments => {
          const db = seedDatabase(comments);
          try {
            const before = readColumn(db, 'commets');
            // Sanity: the seed faithfully stored the generated values.
            expect(before).toEqual(comments);

            const migration = new RenameCommetsToComments1700000000001();
            await migration.up(makeQueryRunner(db));

            const after = readColumn(db, 'comments');

            // Core guarantee: every stored value survives the rename unchanged
            // and in the same order.
            expect(after).toEqual(comments);
            // The misspelled column must no longer exist in the schema, and the
            // corrected column must.
            expect(columnNames(db)).toContain('comments');
            expect(columnNames(db)).not.toContain('commets');
          } finally {
            db.close();
          }
        },
      ),
      {numRuns: 100},
    );
  });
});
