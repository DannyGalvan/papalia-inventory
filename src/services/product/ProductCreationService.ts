import { getErrorMessage } from '../../utils/getErrorMessage';
import { requestedCode, toNewProductRecord } from './productDraft';
import { duplicateSkuMessage, validateSku } from './sku';
import {
  CreateProductResult,
  ProductCodeGenerator,
  ProductCreationStore,
  ProductDraft,
} from './types';

export interface CreateProductOptions {
  /**
   * Keep a non-blank `draft.code` (Excel imports). Otherwise the code is
   * always auto-generated, whatever the draft carries.
   */
  allowProvidedCode?: boolean;
}

/**
 * Creates products with an auto-generated code and an optional, unique SKU.
 * Code reservation and insert happen in one transaction, so a failed insert
 * never burns a sequence number.
 */
export class ProductCreationService {
  constructor(
    private readonly store: ProductCreationStore,
    private readonly codes: ProductCodeGenerator,
  ) {}

  /** Code the next product will most likely get (display only). */
  previewNextCode(): Promise<string> {
    return this.store.runInTransaction(tx => this.codes.peek(tx));
  }

  async create(
    draft: ProductDraft,
    options: CreateProductOptions = {},
  ): Promise<CreateProductResult> {
    const skuError = validateSku(draft.sku);
    if (skuError) {
      return { ok: false, failure: 'invalid_sku', message: skuError };
    }
    const manualCode = options.allowProvidedCode ? requestedCode(draft) : '';

    try {
      return await this.store.runInTransaction<CreateProductResult>(
        async tx => {
          const pending = toNewProductRecord(draft, manualCode);

          if (manualCode && (await tx.codeExists(manualCode))) {
            return {
              ok: false,
              failure: 'duplicate_code',
              message: `El código ${manualCode} ya existe`,
            };
          }
          if (pending.sku) {
            const owner = await tx.findSkuOwner(pending.sku);
            if (owner) {
              return {
                ok: false,
                failure: 'duplicate_sku',
                message: duplicateSkuMessage(pending.sku, owner),
              };
            }
          }

          const code = manualCode || (await this.codes.reserve(tx));
          const product = { ...pending, code };
          await tx.insertProduct(product);
          return {
            ok: true,
            product,
            message: `Producto ${code} creado`,
          };
        },
      );
    } catch (error: unknown) {
      return {
        ok: false,
        failure: 'unknown',
        message: `Error al crear el producto: ${getErrorMessage(
          error,
          'error desconocido',
        )}`,
      };
    }
  }
}
