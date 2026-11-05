import { Product } from '../../database/models/Product';
import { Response } from '../../database/models/response/Response';
import { CreateProductResult } from './types';

/** Adapts a creation result to the `Response` shape `useForm` consumes. */
export const toProductResponse = (
  result: CreateProductResult,
): Response<Product> =>
  result.ok
    ? {
        success: true,
        message: result.message,
        data: Object.assign(new Product(), result.product),
      }
    : { success: false, message: result.message, data: null };
