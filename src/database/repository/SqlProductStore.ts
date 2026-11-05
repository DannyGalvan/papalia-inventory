import { KEY_PRODUCT_CODE_SEQUENCE } from '../../config/constants';
import {
  NewProductRecord,
  ProductCreationStore,
  ProductCreationTx,
  ProductSkuLookup,
} from '../../services/product/types';
import { toNumber, toText } from '../utils/nitroValues';
import { buildProductInsert } from '../utils/productInsert';
import { SqlExecutor, TransactionalSqlExecutor } from '../utils/sqlExecutor';

const findSkuOwner = async (
  sql: SqlExecutor,
  sku: string,
  exceptCode = '',
): Promise<string | null> => {
  const rows = await sql.query(
    'SELECT "code" FROM "product" WHERE "sku" = ? COLLATE NOCASE AND "code" <> ? LIMIT 1',
    [sku, exceptCode],
  );
  return rows[0] ? toText(rows[0].code) : null;
};

/**
 * Raw-SQL implementation of the product-creation port. Values are bound as
 * string/number only: nitro-sqlite on Android mis-binds booleans and NULL.
 */
class SqlProductCreationTx implements ProductCreationTx {
  constructor(private readonly sql: SqlExecutor) {}

  async findCodesWithPrefix(prefix: string): Promise<string[]> {
    const rows = await this.sql.query(
      'SELECT "code" FROM "product" WHERE substr("code", 1, ?) = ?',
      [prefix.length, prefix],
    );
    return rows.map(row => toText(row.code));
  }

  async getLastSequence(): Promise<number> {
    const rows = await this.sql.query(
      'SELECT "value" FROM "configuration" WHERE "key" = ?',
      [KEY_PRODUCT_CODE_SEQUENCE],
    );
    const value = Math.trunc(toNumber(rows[0]?.value));
    return value > 0 ? value : 0;
  }

  async saveLastSequence(sequence: number): Promise<void> {
    await this.sql.query(
      'INSERT OR REPLACE INTO "configuration" ("key", "value") VALUES (?, ?)',
      [KEY_PRODUCT_CODE_SEQUENCE, String(sequence)],
    );
  }

  async codeExists(code: string): Promise<boolean> {
    const rows = await this.sql.query(
      'SELECT 1 AS "found" FROM "product" WHERE "code" = ? LIMIT 1',
      [code],
    );
    return rows.length > 0;
  }

  findSkuOwner(sku: string, exceptCode?: string): Promise<string | null> {
    return findSkuOwner(this.sql, sku, exceptCode);
  }

  async insertProduct(product: NewProductRecord): Promise<void> {
    const { sql, params } = buildProductInsert(product);
    await this.sql.query(sql, params);
  }
}

/** Product persistence for code generation, SKU checks and inserts. */
export class SqlProductStore implements ProductCreationStore, ProductSkuLookup {
  constructor(private readonly sql: TransactionalSqlExecutor) {}

  runInTransaction<T>(work: (tx: ProductCreationTx) => Promise<T>): Promise<T> {
    return this.sql.transaction(tx => work(new SqlProductCreationTx(tx)));
  }

  findSkuOwner(sku: string, exceptCode?: string): Promise<string | null> {
    return findSkuOwner(this.sql, sku, exceptCode);
  }
}
