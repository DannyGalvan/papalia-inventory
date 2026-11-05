import { normalizeSku } from './sku';
import { NewProductRecord, ProductDraft } from './types';

const toFiniteNumber = (value: unknown): number => {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return 0;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toOptionalId = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) ? value : null;

const toText = (value: unknown): string =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

/** Normalises form/import values into the row stored for `code`. */
export const toNewProductRecord = (
  draft: ProductDraft,
  code: string,
): NewProductRecord => ({
  code,
  sku: normalizeSku(draft.sku),
  name: toText(draft.name).trim(),
  description: toText(draft.description).trim(),
  price: toFiniteNumber(draft.price),
  cost: Math.max(0, toFiniteNumber(draft.cost)),
  stock: Math.trunc(toFiniteNumber(draft.stock)),
  image: toText(draft.image),
  isActive: draft.isActive !== false,
  categoryId: toOptionalId(draft.categoryId),
  supplierId: toOptionalId(draft.supplierId),
  unitId: toOptionalId(draft.unitId),
});

/** Code typed in an import row (trimmed); '' means "generate one". */
export const requestedCode = (draft: ProductDraft): string =>
  toText(draft.code).trim();
