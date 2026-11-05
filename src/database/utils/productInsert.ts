import { NewProductRecord } from '../../services/product/types';
import { SqlParam } from './sqlExecutor';

/**
 * INSERT for a product row. Null FK columns are omitted (SQLite applies the
 * NULL default) because nitro-sqlite on Android cannot bind null parameters;
 * the boolean is bound as 0/1 for the same reason.
 */
export const buildProductInsert = (
  product: NewProductRecord,
): { sql: string; params: SqlParam[] } => {
  const entries: [string, SqlParam][] = [
    ['code', product.code],
    ['sku', product.sku],
    ['name', product.name],
    ['description', product.description],
    ['price', product.price],
    ['cost', product.cost],
    ['stock', product.stock],
    ['image', product.image],
    ['isActive', product.isActive ? 1 : 0],
  ];
  const optionalFks: [string, number | null][] = [
    ['categoryId', product.categoryId],
    ['supplierId', product.supplierId],
    ['unitId', product.unitId],
  ];
  for (const [column, value] of optionalFks) {
    if (value !== null) {
      entries.push([column, value]);
    }
  }
  const columns = entries.map(([column]) => `"${column}"`).join(', ');
  const placeholders = entries.map(() => '?').join(', ');
  return {
    sql: `INSERT INTO "product" (${columns}) VALUES (${placeholders})`,
    params: entries.map(([, value]) => value),
  };
};
