import { FindOptionsWhere } from 'typeorm';
import { Product } from '../models/Product';
import { sqliteBoolean } from '../utils/sqliteBoolean';

/** Which products a listing/search should include. */
export type ProductStatusFilter = 'all' | 'active' | 'inactive';

/** WHERE fragment for a status filter (`{}` for `all`). */
export const buildProductStatusWhere = (
  status: ProductStatusFilter,
): FindOptionsWhere<Product> => {
  if (status === 'all') {
    return {};
  }
  return { isActive: sqliteBoolean(status === 'active') };
};
