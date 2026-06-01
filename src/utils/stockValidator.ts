/**
 * Stock validation utilities for the Output (salida) flow.
 *
 * This module provides pure validation functions that check whether requested
 * output quantities exceed available product stock. It is intentionally free of
 * any React / React Native dependencies so it can be unit- and property-tested
 * in isolation (see Properties 8–11) and reused by CreateOutputScreen and
 * LogForm components.
 *
 * Business rules:
 * - Requirement 6.1: For each product in an output, quantity must not exceed
 *   current stock.
 * - Requirement 6.2: When validation fails, display a Spanish error message
 *   containing the quantity, stock, and product name.
 * - Requirement 6.7: When multiple products fail, report the first failure.
 * - Requirement 7.1: Inline check when quantity changes.
 * - Requirement 7.2: Inline warning message format "Stock disponible: [stock]".
 *
 * Requirements: 6.1, 6.2, 6.7, 7.1, 7.2
 */

/** Result of validating all products in an output submission. */
export interface StockValidationResult {
  isValid: boolean;
  /** Spanish error message for Toast display on submission failure. */
  errorMessage?: string;
  /** Product code of the first product that failed validation. */
  failedProductCode?: string;
}

/** Inline warning state for a single product quantity check. */
export interface InlineStockWarning {
  productCode: string;
  /** Warning message: "Stock disponible: [stock]" */
  warningMessage: string;
  /** Whether the warning should be displayed. */
  hasWarning: boolean;
}

/** Detail item shape expected by the validator. */
export interface OutputDetail {
  productCode: string;
  name: string;
  quantity: number;
}

/**
 * Format the submission-time error message in Spanish.
 *
 * Template: "La cantidad solicitada ([quantity]) excede el stock disponible
 * ([stock]) para el producto [productName]"
 *
 * @param quantity The requested output quantity.
 * @param stock The current available stock.
 * @param productName The product display name.
 * @returns A Spanish error message string containing all required values.
 */
export function formatStockError(
  quantity: number,
  stock: number,
  productName: string,
): string {
  return `La cantidad solicitada (${quantity}) excede el stock disponible (${stock}) para el producto ${productName}`;
}

/**
 * Validate all products in an output submission against current stock levels.
 *
 * Iterates through the details array in order and reports the **first** product
 * whose requested quantity exceeds available stock (Requirement 6.7).
 *
 * @param details Array of output detail items with productCode, name, and quantity.
 * @param currentStocks Map from productCode to current available stock.
 * @returns A {@link StockValidationResult} indicating pass/fail with error info.
 */
export function validateStockForOutput(
  details: OutputDetail[],
  currentStocks: Map<string, number>,
): StockValidationResult {
  for (const detail of details) {
    const stock = currentStocks.get(detail.productCode);

    // If stock is undefined, treat as 0 (product not found scenario)
    const availableStock = stock ?? 0;

    if (detail.quantity > availableStock) {
      return {
        isValid: false,
        errorMessage: formatStockError(
          detail.quantity,
          availableStock,
          detail.name,
        ),
        failedProductCode: detail.productCode,
      };
    }
  }

  return { isValid: true };
}

/**
 * Check stock for a single product (inline/real-time validation).
 *
 * Returns an {@link InlineStockWarning} indicating whether the entered quantity
 * exceeds available stock. When it does, the warning message is formatted as
 * "Stock disponible: [stock]" (Requirement 7.2).
 *
 * @param quantity The quantity entered by the user.
 * @param availableStock The current available stock for the product.
 * @param productName The product display name (used to identify the product).
 * @returns An {@link InlineStockWarning} with hasWarning and warningMessage.
 */
export function checkStockForProduct(
  quantity: number,
  availableStock: number,
  productName: string,
): InlineStockWarning {
  const hasWarning = quantity > availableStock;

  return {
    productCode: productName,
    warningMessage: hasWarning ? `Stock disponible: ${availableStock}` : '',
    hasWarning,
  };
}
