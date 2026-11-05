import { Product } from '../database/models/Product';
import { FormErrors } from '../hooks/useForm';
import { validateSku } from '../services/product/sku';

/**
 * Field errors for the product form. The code is not validated: it is
 * auto-generated on creation and immutable afterwards.
 */
export const validateProductForm = (form: Product): FormErrors => {
  const errors: FormErrors = {};
  const skuError = validateSku(form.sku);
  if (skuError) {
    errors.sku = skuError;
  }
  if (!form.name) {
    errors.name = 'El nombre es requerido';
  }
  if (!form.description) {
    errors.description = 'La descripcion es requerida';
  }
  if (!form.price) {
    errors.price = 'El precio es requerido';
  }
  const costText = String(form.cost ?? '').trim();
  if (costText === '') {
    errors.cost = 'El costo es requerido';
  } else if (!Number.isFinite(Number(costText)) || Number(costText) < 0) {
    errors.cost = 'El costo debe ser un número mayor o igual a 0';
  }
  if (form.stock === undefined || form.stock === null) {
    errors.stock = 'El stock es requerido';
  }
  return errors;
};
