import {
  DEFAULT_PRODUCT_CODE_FORMAT,
  ProductCodeFormat,
  formatProductCode,
  highestProductCodeSequence,
} from './productCodeFormat';
import { ProductCodeGenerator, ProductCodeSequenceStore } from './types';

/**
 * Sequential codes (`PRD-000001`, `PRD-000002`, …). The next number is above
 * both the last reserved one (so codes of deleted products are never reused)
 * and any existing code with the same shape (e.g. imported from Excel).
 */
export class SequentialProductCodeGenerator implements ProductCodeGenerator {
  constructor(
    private readonly format: ProductCodeFormat = DEFAULT_PRODUCT_CODE_FORMAT,
  ) {}

  async peek(store: ProductCodeSequenceStore): Promise<string> {
    return formatProductCode(await this.nextSequence(store), this.format);
  }

  async reserve(store: ProductCodeSequenceStore): Promise<string> {
    const sequence = await this.nextSequence(store);
    await store.saveLastSequence(sequence);
    return formatProductCode(sequence, this.format);
  }

  private async nextSequence(store: ProductCodeSequenceStore) {
    const [codes, last] = await Promise.all([
      store.findCodesWithPrefix(this.format.prefix),
      store.getLastSequence(),
    ]);
    return Math.max(last, highestProductCodeSequence(codes, this.format)) + 1;
  }
}
