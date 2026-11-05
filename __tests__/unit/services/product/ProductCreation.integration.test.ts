/**
 * ProductCreationService + SqlProductStore executed against an in-memory
 * SQLite database (sql.js) migrated with AddProductSku, so the real SQL, the
 * unique index and the transaction rollback paths are exercised.
 */

import initSqlJs, { Database } from 'sql.js';
import type { QueryRunner } from 'typeorm';
import { KEY_PRODUCT_CODE_SEQUENCE } from '../../../../src/config/constants';
import { AddProductSku1700000000008 } from '../../../../src/database/migrations/AddProductSku1700000000008';
import { SqlProductStore } from '../../../../src/database/repository/SqlProductStore';
import { ProductCreationService } from '../../../../src/services/product/ProductCreationService';
import { SequentialProductCodeGenerator } from '../../../../src/services/product/SequentialProductCodeGenerator';
import { ProductDraft } from '../../../../src/services/product/types';
import { createSqlJsExecutor, runSql } from '../../../helpers/sqlJsExecutor';

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

beforeAll(async () => {
  SQL = await initSqlJs();
});

async function seed(): Promise<Database> {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE "configuration" ("key" varchar PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL);
    CREATE TABLE "product" (
      "code" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL,
      "description" varchar NOT NULL, "price" decimal NOT NULL,
      "stock" integer NOT NULL, "image" varchar NOT NULL DEFAULT '',
      "categoryId" integer DEFAULT NULL, "supplierId" integer DEFAULT NULL,
      "unitId" integer DEFAULT NULL, "cost" decimal NOT NULL DEFAULT 0,
      "isActive" boolean NOT NULL DEFAULT 1);
  `);
  await new AddProductSku1700000000008().up({
    query: async (sql: string) => db.run(sql),
  } as unknown as QueryRunner);
  return db;
}

const createService = (db: Database, failOn?: string) =>
  new ProductCreationService(
    new SqlProductStore(
      createSqlJsExecutor(db, {
        beforeQuery: sql => {
          if (failOn && sql.includes(failOn)) {
            throw new Error('disk I/O error');
          }
        },
      }),
    ),
    new SequentialProductCodeGenerator(),
  );

const draft = (overrides: Partial<ProductDraft> = {}): ProductDraft => ({
  code: '',
  sku: '',
  name: 'Café',
  description: 'Molido',
  price: '45.5',
  cost: '30',
  stock: '10',
  image: '',
  isActive: true,
  categoryId: null,
  supplierId: null,
  unitId: null,
  ...overrides,
});

const rows = (db: Database) =>
  runSql(
    db,
    'SELECT "code","sku","name","price","cost","stock","isActive","categoryId" FROM "product" ORDER BY "code"',
  );

const storedSequence = (db: Database) =>
  runSql(db, 'SELECT "value" FROM "configuration" WHERE "key" = ?', [
    KEY_PRODUCT_CODE_SEQUENCE,
  ])[0]?.value;

describe('ProductCreationService (sql.js)', () => {
  it('auto-generates sequential codes and stores normalised values', async () => {
    const db = await seed();
    const service = createService(db);

    const first = await service.create(draft());
    const second = await service.create(draft({ name: 'Té', stock: '2.9' }));

    expect(first).toMatchObject({
      ok: true,
      product: { code: 'PRD-000001' },
      message: 'Producto PRD-000001 creado',
    });
    expect(second).toMatchObject({ ok: true, product: { code: 'PRD-000002' } });
    expect(rows(db)).toEqual([
      {
        code: 'PRD-000001',
        sku: '',
        name: 'Café',
        price: 45.5,
        cost: 30,
        stock: 10,
        isActive: 1,
        categoryId: null,
      },
      {
        code: 'PRD-000002',
        sku: '',
        name: 'Té',
        price: 45.5,
        cost: 30,
        stock: 2,
        isActive: 1,
        categoryId: null,
      },
    ]);
    expect(storedSequence(db)).toBe('2');
    db.close();
  });

  it('ignores a code typed in the form unless explicitly allowed', async () => {
    const db = await seed();
    const result = await createService(db).create(
      draft({ code: 'PRD-000777' }),
    );
    expect(result).toMatchObject({ ok: true, product: { code: 'PRD-000001' } });
    db.close();
  });

  it('keeps imported codes and continues the sequence after them', async () => {
    const db = await seed();
    const service = createService(db);

    const imported = await service.create(draft({ code: ' PRD-000050 ' }), {
      allowProvidedCode: true,
    });
    const legacy = await service.create(draft({ code: 'P-0001' }), {
      allowProvidedCode: true,
    });
    const generated = await service.create(draft({ code: '' }), {
      allowProvidedCode: true,
    });

    expect(imported).toMatchObject({
      ok: true,
      product: { code: 'PRD-000050' },
    });
    expect(legacy).toMatchObject({ ok: true, product: { code: 'P-0001' } });
    expect(generated).toMatchObject({
      ok: true,
      product: { code: 'PRD-000051' },
    });
    db.close();
  });

  it('never reuses the code of a deleted product', async () => {
    const db = await seed();
    const service = createService(db);
    await service.create(draft());
    await service.create(draft());
    db.run('DELETE FROM "product" WHERE "code" = \'PRD-000002\'');

    const next = await service.create(draft());
    expect(next).toMatchObject({ ok: true, product: { code: 'PRD-000003' } });
    db.close();
  });

  it('rejects an imported code that already exists', async () => {
    const db = await seed();
    const service = createService(db);
    await service.create(draft({ code: 'A-1' }), { allowProvidedCode: true });

    const dup = await service.create(draft({ code: 'A-1' }), {
      allowProvidedCode: true,
    });
    expect(dup).toEqual({
      ok: false,
      failure: 'duplicate_code',
      message: 'El código A-1 ya existe',
    });
    expect(rows(db)).toHaveLength(1);
    db.close();
  });

  it('stores an optional SKU and rejects duplicates case-insensitively', async () => {
    const db = await seed();
    const service = createService(db);

    const withSku = await service.create(draft({ sku: '  ABC-123 ' }));
    const dup = await service.create(draft({ sku: 'abc-123' }));

    expect(withSku).toMatchObject({
      ok: true,
      product: { code: 'PRD-000001', sku: 'ABC-123' },
    });
    expect(dup).toEqual({
      ok: false,
      failure: 'duplicate_sku',
      message: 'El SKU "abc-123" ya está asignado al producto PRD-000001',
    });
    // The rejected attempt did not burn a sequence number.
    expect(storedSequence(db)).toBe('1');
    db.close();
  });

  it('allows many products without SKU', async () => {
    const db = await seed();
    const service = createService(db);
    for (let i = 0; i < 3; i++) {
      expect((await service.create(draft({ sku: '' }))).ok).toBe(true);
    }
    expect(rows(db).map(r => r.sku)).toEqual(['', '', '']);
    db.close();
  });

  it('rejects an invalid SKU before touching the database', async () => {
    const db = await seed();
    const result = await createService(db).create(
      draft({ sku: 'x'.repeat(51) }),
    );
    expect(result).toMatchObject({ ok: false, failure: 'invalid_sku' });
    expect(rows(db)).toHaveLength(0);
    db.close();
  });

  it('enforces SKU uniqueness at the database level too', async () => {
    const db = await seed();
    await createService(db).create(draft({ sku: 'Z9' }));
    expect(() =>
      db.run(
        `INSERT INTO "product" ("code","sku","name","description","price","stock")
         VALUES ('X','z9','n','d',1,1)`,
      ),
    ).toThrow(/UNIQUE/);
    db.close();
  });

  it('saves optional relations when present', async () => {
    const db = await seed();
    await createService(db).create(draft({ categoryId: 4 }));
    expect(rows(db)[0].categoryId).toBe(4);
    db.close();
  });

  it('rolls back the reserved code when the insert fails', async () => {
    const db = await seed();
    const result = await createService(db, 'INSERT INTO "product"').create(
      draft(),
    );

    expect(result).toEqual({
      ok: false,
      failure: 'unknown',
      message: 'Error al crear el producto: disk I/O error',
    });
    expect(storedSequence(db)).toBeUndefined();

    const retry = await createService(db).create(draft());
    expect(retry).toMatchObject({ ok: true, product: { code: 'PRD-000001' } });
    db.close();
  });

  it('previews the next code without reserving it', async () => {
    const db = await seed();
    const service = createService(db);
    await service.create(draft());

    await expect(service.previewNextCode()).resolves.toBe('PRD-000002');
    await expect(service.previewNextCode()).resolves.toBe('PRD-000002');
    expect(storedSequence(db)).toBe('1');
    db.close();
  });

  it('looks up SKU owners outside a transaction, excluding the edited product', async () => {
    const db = await seed();
    await createService(db).create(draft({ sku: 'K-1' }));
    const store = new SqlProductStore(createSqlJsExecutor(db));

    await expect(store.findSkuOwner('k-1')).resolves.toBe('PRD-000001');
    await expect(store.findSkuOwner('K-1', 'PRD-000001')).resolves.toBeNull();
    await expect(store.findSkuOwner('NOPE')).resolves.toBeNull();
    db.close();
  });
});
