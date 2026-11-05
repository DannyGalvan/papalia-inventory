jest.mock('typeorm', () => require('../../../helpers/typeormDecoratorsMock'));

import { Product } from '../../../../src/database/models/Product';
import { Response } from '../../../../src/database/models/response/Response';
import { ProductUpdateService } from '../../../../src/services/product/ProductUpdateService';
import { ProductSkuLookup } from '../../../../src/services/product/types';

const product = (overrides: Partial<Product> = {}): Product =>
  Object.assign(new Product(), {
    code: 'PRD-000001',
    sku: '',
    name: 'Café',
    description: 'Molido',
    price: 10,
    cost: 5,
    stock: 1,
    image: '',
    ...overrides,
  });

const ok = (p: Product): Response<Product> => ({
  success: true,
  message: 'Producto actualizado',
  data: p,
});

const setup = (owner: string | null | Error = null) => {
  const skus: ProductSkuLookup = {
    findSkuOwner: jest.fn(async () => {
      if (owner instanceof Error) {
        throw owner;
      }
      return owner;
    }),
  };
  const persist = jest.fn(async (p: Product) => ok(p));
  return { service: new ProductUpdateService(skus, persist), skus, persist };
};

describe('ProductUpdateService', () => {
  it('persists a trimmed SKU excluding the product itself from the check', async () => {
    const { service, skus, persist } = setup();
    const result = await service.update(product({ sku: '  NEW-1 ' }));

    expect(skus.findSkuOwner).toHaveBeenCalledWith('NEW-1', 'PRD-000001');
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PRD-000001', sku: 'NEW-1' }),
    );
    expect(result.success).toBe(true);
  });

  it('allows clearing the SKU without a lookup', async () => {
    const { service, skus, persist } = setup();
    await service.update(product({ sku: '   ' }));
    expect(skus.findSkuOwner).not.toHaveBeenCalled();
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ sku: '' }));
  });

  it('rejects a SKU owned by another product', async () => {
    const { service, persist } = setup('PRD-000009');
    const result = await service.update(product({ sku: 'DUP' }));
    expect(result).toEqual({
      success: false,
      message: 'El SKU "DUP" ya está asignado al producto PRD-000009',
      data: null,
    });
    expect(persist).not.toHaveBeenCalled();
  });

  it('rejects an invalid SKU', async () => {
    const { service, persist } = setup();
    const result = await service.update(product({ sku: 'A\tB' }));
    expect(result.success).toBe(false);
    expect(persist).not.toHaveBeenCalled();
  });

  it('fails safely when the lookup errors', async () => {
    const { service, persist } = setup(new Error('locked'));
    const result = await service.update(product({ sku: 'X' }));
    expect(result).toEqual({
      success: false,
      message: 'No se pudo validar el SKU, intenta de nuevo',
      data: null,
    });
    expect(persist).not.toHaveBeenCalled();
  });
});
