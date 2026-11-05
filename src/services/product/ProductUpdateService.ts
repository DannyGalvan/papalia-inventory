import { Product } from '../../database/models/Product';
import { Response } from '../../database/models/response/Response';
import { duplicateSkuMessage, normalizeSku, validateSku } from './sku';
import { ProductSkuLookup } from './types';

/** Persists an already validated product (the repository's update). */
export type ProductUpdater = (product: Product) => Promise<Response<Product>>;

const rejection = (message: string): Response<Product> => ({
  success: false,
  message,
  data: null,
});

/**
 * Updates a product enforcing the SKU rules. The code is immutable; the SKU
 * can be added, changed or cleared ('' = no SKU).
 */
export class ProductUpdateService {
  constructor(
    private readonly skus: ProductSkuLookup,
    private readonly persist: ProductUpdater,
  ) {}

  async update(product: Product): Promise<Response<Product>> {
    const skuError = validateSku(product.sku);
    if (skuError) {
      return rejection(skuError);
    }
    const sku = normalizeSku(product.sku);
    if (sku) {
      try {
        const owner = await this.skus.findSkuOwner(sku, product.code);
        if (owner) {
          return rejection(duplicateSkuMessage(sku, owner));
        }
      } catch {
        return rejection('No se pudo validar el SKU, intenta de nuevo');
      }
    }
    return this.persist({ ...product, sku } as Product);
  }
}
