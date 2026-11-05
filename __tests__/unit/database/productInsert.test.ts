import { buildProductInsert } from '../../../src/database/utils/productInsert';
import { NewProductRecord } from '../../../src/services/product/types';

const base: NewProductRecord = {
  code: 'PRD-000001',
  sku: 'S-1',
  name: 'Café',
  description: 'd',
  price: 10,
  cost: 4,
  stock: 3,
  image: '',
  isActive: false,
  categoryId: null,
  supplierId: null,
  unitId: null,
};

describe('buildProductInsert', () => {
  it('omits null FKs and binds booleans as integers', () => {
    const { sql, params } = buildProductInsert(base);
    expect(sql).toBe(
      'INSERT INTO "product" ("code", "sku", "name", "description", "price", "cost", "stock", "image", "isActive") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    expect(params).toEqual(['PRD-000001', 'S-1', 'Café', 'd', 10, 4, 3, '', 0]);
  });

  it('includes FKs that are set and never binds null', () => {
    const { sql, params } = buildProductInsert({
      ...base,
      isActive: true,
      categoryId: 1,
      unitId: 3,
    });
    expect(sql).toContain('"categoryId", "unitId")');
    expect(sql).not.toContain('supplierId');
    expect(params.slice(-3)).toEqual([1, 1, 3]);
    expect(params).not.toContain(null);
  });
});
