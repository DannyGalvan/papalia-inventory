import {
  SKU_MAX_LENGTH,
  duplicateSkuMessage,
  normalizeSku,
  validateSku,
} from '../../../../src/services/product/sku';

describe('normalizeSku', () => {
  it('trims text', () => {
    expect(normalizeSku('  ABC-1 ')).toBe('ABC-1');
  });

  it('keeps numeric SKUs read from Excel as text', () => {
    expect(normalizeSku(12345)).toBe('12345');
  });

  it.each([undefined, null, Number.NaN, {}, { isNitroSQLiteNull: true }, true])(
    'maps %p to no SKU',
    value => {
      expect(normalizeSku(value)).toBe('');
    },
  );
});

describe('validateSku', () => {
  it('accepts an empty / missing SKU (optional field)', () => {
    expect(validateSku('')).toBeNull();
    expect(validateSku('   ')).toBeNull();
    expect(validateSku(undefined)).toBeNull();
  });

  it('accepts common supplier formats', () => {
    for (const sku of ['ABC-123', 'a.b/c_9', '0012', 'Caja 12 x 500g']) {
      expect(validateSku(sku)).toBeNull();
    }
  });

  it('limits the length after trimming', () => {
    expect(validateSku(` ${'x'.repeat(SKU_MAX_LENGTH)} `)).toBeNull();
    expect(validateSku('x'.repeat(SKU_MAX_LENGTH + 1))).toMatch(/50/);
  });

  it('rejects control characters', () => {
    expect(validateSku('AB\tC')).toMatch(/no permitidos/);
    expect(validateSku('AB\nC')).toMatch(/no permitidos/);
  });

  it('builds the duplicate message', () => {
    expect(duplicateSkuMessage('X1', 'PRD-000002')).toBe(
      'El SKU "X1" ya está asignado al producto PRD-000002',
    );
  });
});
