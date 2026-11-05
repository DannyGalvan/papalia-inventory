jest.mock('typeorm', () => require('../../../helpers/typeormDecoratorsMock'));

import { Product } from '../../../../src/database/models/Product';
import { toProductResponse } from '../../../../src/services/product/toProductResponse';
import { NewProductRecord } from '../../../../src/services/product/types';

const record: NewProductRecord = {
  code: 'PRD-000001',
  sku: 'S-1',
  name: 'Café',
  description: 'd',
  price: 1,
  cost: 0,
  stock: 2,
  image: '',
  isActive: true,
  categoryId: null,
  supplierId: null,
  unitId: null,
};

describe('toProductResponse', () => {
  it('maps a success into a Product response', () => {
    const response = toProductResponse({
      ok: true,
      product: record,
      message: 'Producto PRD-000001 creado',
    });
    expect(response.success).toBe(true);
    expect(response.message).toBe('Producto PRD-000001 creado');
    expect(response.data).toBeInstanceOf(Product);
    expect(response.data).toMatchObject({ code: 'PRD-000001', sku: 'S-1' });
  });

  it('maps a rejection', () => {
    expect(
      toProductResponse({ ok: false, failure: 'duplicate_sku', message: 'x' }),
    ).toEqual({ success: false, message: 'x', data: null });
  });
});
