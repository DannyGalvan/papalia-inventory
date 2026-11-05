import {
  requestedCode,
  toNewProductRecord,
} from '../../../../src/services/product/productDraft';

describe('toNewProductRecord', () => {
  it('converts form text into typed values', () => {
    expect(
      toNewProductRecord(
        {
          name: ' Café ',
          description: ' d ',
          price: '12.50',
          cost: '',
          stock: '3.7',
          sku: ' S1 ',
          categoryId: 2,
          supplierId: null,
        },
        'PRD-000001',
      ),
    ).toEqual({
      code: 'PRD-000001',
      sku: 'S1',
      name: 'Café',
      description: 'd',
      price: 12.5,
      cost: 0,
      stock: 3,
      image: '',
      isActive: true,
      categoryId: 2,
      supplierId: null,
      unitId: null,
    });
  });

  it('falls back to safe defaults for garbage input', () => {
    const record = toNewProductRecord(
      {
        name: 'n',
        description: 'd',
        price: 'abc',
        cost: -5,
        stock: Number.NaN,
        image: null,
        isActive: false,
        unitId: 1.5,
      },
      'C',
    );
    expect(record).toMatchObject({
      price: 0,
      cost: 0,
      stock: 0,
      image: '',
      isActive: false,
      unitId: null,
    });
  });
});

describe('requestedCode', () => {
  it('trims and tolerates missing codes', () => {
    expect(requestedCode({ code: ' A-1 ' } as never)).toBe('A-1');
    expect(requestedCode({} as never)).toBe('');
  });
});
