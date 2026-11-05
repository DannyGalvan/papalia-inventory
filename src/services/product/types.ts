/** Contracts for creating products and managing their codes / SKUs. */

/** Values captured by the product form or an Excel import row. */
export interface ProductDraft {
  /** Only honoured by imports; blank → auto-generated. */
  code?: string;
  sku?: unknown;
  name: string;
  description: string;
  price: number | string;
  cost?: number | string | null;
  stock: number | string;
  image?: string | null;
  isActive?: boolean;
  categoryId?: number | null;
  supplierId?: number | null;
  unitId?: number | null;
}

/** Fully normalised row ready to be inserted. */
export interface NewProductRecord {
  code: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  image: string;
  isActive: boolean;
  categoryId: number | null;
  supplierId: number | null;
  unitId: number | null;
}

/** Persistence needed to derive the next sequential product code. */
export interface ProductCodeSequenceStore {
  /** Existing product codes starting with `prefix`. */
  findCodesWithPrefix(prefix: string): Promise<string[]>;
  /** Last reserved sequence (0 when none was ever reserved). */
  getLastSequence(): Promise<number>;
  saveLastSequence(sequence: number): Promise<void>;
}

/** Produces unique product codes. */
export interface ProductCodeGenerator {
  /** Next code without reserving it (for display only). */
  peek(store: ProductCodeSequenceStore): Promise<string>;
  /** Next code, reserved so it is never handed out again. */
  reserve(store: ProductCodeSequenceStore): Promise<string>;
}

/** Looks up which product owns a SKU (case-insensitive). */
export interface ProductSkuLookup {
  /** Code of the product using `sku`, ignoring `exceptCode`; else `null`. */
  findSkuOwner(sku: string, exceptCode?: string): Promise<string | null>;
}

/** Operations available inside a single product-creation transaction. */
export interface ProductCreationTx
  extends ProductCodeSequenceStore,
    ProductSkuLookup {
  codeExists(code: string): Promise<boolean>;
  insertProduct(product: NewProductRecord): Promise<void>;
}

/** Persistence port: runs `work` atomically (all or nothing). */
export interface ProductCreationStore {
  runInTransaction<T>(work: (tx: ProductCreationTx) => Promise<T>): Promise<T>;
}

export type ProductWriteFailure =
  | 'invalid_sku'
  | 'duplicate_sku'
  | 'duplicate_code'
  | 'unknown';

export interface ProductWriteRejection {
  ok: false;
  failure: ProductWriteFailure;
  message: string;
}

export type CreateProductResult =
  | { ok: true; product: NewProductRecord; message: string }
  | ProductWriteRejection;
