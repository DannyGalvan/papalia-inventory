jest.mock('typeorm', () => require('../../helpers/typeormDecoratorsMock'));

import { Product } from '../../../src/database/models/Product';
import { validateProductForm } from '../../../src/utils/validateProductForm';

const form = (overrides: Partial<Product> = {}): Product =>
  Object.assign(new Product(), {
    code: '',
    sku: '',
    name: 'Café',
    description: 'Molido',
    price: '10',
    cost: '5',
    stock: '1',
    ...overrides,
  });

describe('validateProductForm', () => {
  it('accepts a form without code (auto-generated) and without SKU', () => {
    expect(validateProductForm(form())).toEqual({});
  });

  it('accepts a valid SKU', () => {
    expect(validateProductForm(form({ sku: 'ABC-1' }))).toEqual({});
  });

  it('flags an invalid SKU', () => {
    expect(validateProductForm(form({ sku: 'x'.repeat(60) })).sku).toMatch(
      /50/,
    );
  });

  it('keeps the existing required-field rules', () => {
    const errors = validateProductForm(
      form({
        name: '',
        description: '',
        price: 0,
        cost: '' as unknown as number,
        stock: null as unknown as number,
      }),
    );
    expect(Object.keys(errors).sort()).toEqual(
      ['cost', 'description', 'name', 'price', 'stock'].sort(),
    );
  });

  it('rejects a negative cost', () => {
    expect(validateProductForm(form({ cost: -1 })).cost).toMatch(
      /mayor o igual/,
    );
  });
});
