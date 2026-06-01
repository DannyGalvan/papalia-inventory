# Implementation Plan: Dashboard Reports & Inventory Validation

## Overview

This plan implements three capabilities: (1) theme application to existing dashboard screens, (2) three new report screens with a ReportService data layer, and (3) stock validation for output creation. Tasks are ordered to build foundational layers first (services, validators), then screens, then integration and wiring.

## Tasks

- [x] 1. Create ReportService and StockValidator foundations
  - [x] 1.1 Create the ReportService module
    - Create `src/services/ReportService.ts`
    - Define interfaces: `LowStockProduct`, `MostMovedProduct`, `CriticalReportData`, `StockDistribution`, `SummaryReportData`, `MovementByType`, `MovementReportData`
    - Implement `getCriticalReportData()` querying Product and LogDetail tables for low stock (≤5), zero stock, and top 10 most moved products
    - Implement `getSummaryReportData()` computing totalProducts, totalInventoryValue (sum of price×stock), totalUnitsInStock, and stockDistribution buckets
    - Implement `getMovementReportData()` computing totalEntryQuantity, totalExitQuantity, movementsByType, and top 5 categories
    - Add error handling: catch errors, log to console, return empty/zero data structures
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.5_

  - [x] 1.2 Create the StockValidator module
    - Create `src/utils/stockValidator.ts`
    - Define interfaces: `StockValidationResult`, `InlineStockWarning`
    - Implement `validateStockForOutput(details, currentStocks)` — iterates details, reports first product where quantity > stock
    - Implement `checkStockForProduct(quantity, availableStock, productName)` — returns inline warning when quantity exceeds stock
    - Implement `formatStockError(quantity, stock, productName)` — returns Spanish error message with all required values
    - _Requirements: 6.1, 6.2, 6.7, 7.1, 7.2_

  - [x] 1.3 Create the monetary formatting utility
    - Create or extend a utility function `formatCurrency(value: number): string` that formats with "Q" prefix and two decimal places
    - Place in `src/utils/formatCurrency.ts`
    - _Requirements: 3.6_

- [x] 2. Property tests for ReportService and StockValidator
  - [x]* 2.1 Write property test: Stock threshold filtering correctly partitions products
    - Create `__tests__/unit/services/ReportService.property.test.ts`
    - **Property 1: Stock threshold filtering correctly partitions products**
    - Generate arbitrary product arrays with non-negative integer stock values
    - Assert low stock filter returns exactly products with stock ≤ 5
    - Assert zero stock filter returns exactly products with stock = 0
    - Assert zero stock is always a subset of low stock
    - **Validates: Requirements 2.1, 2.2**

  - [x]* 2.2 Write property test: Most moved products ranking is correct
    - **Property 2: Most moved products ranking is correct**
    - Generate arbitrary log detail records with product codes and quantities
    - Assert result contains at most 10 products
    - Assert result is ordered by descending total quantity
    - Assert every product in result has total ≥ any product not in result
    - **Validates: Requirements 2.3**

  - [x]* 2.3 Write property test: Inventory summary computations are accurate
    - **Property 3: Inventory summary computations are accurate**
    - Generate arbitrary product arrays with non-negative price and stock
    - Assert totalProducts equals count of products
    - Assert totalInventoryValue equals sum of (price × stock)
    - Assert totalUnitsInStock equals sum of stock
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x]* 2.4 Write property test: Stock distribution bucketing is exhaustive and exclusive
    - **Property 4: Stock distribution bucketing is exhaustive and exclusive**
    - Generate arbitrary product arrays
    - Assert each product is in exactly one bucket (0, 1-5, 6-20, 21-50, >50)
    - Assert sum of all bucket counts equals total number of products
    - **Validates: Requirements 3.4**

  - [x]* 2.5 Write property test: Monetary formatting produces valid output
    - **Property 5: Monetary formatting produces valid output**
    - Generate arbitrary non-negative numeric values
    - Assert output starts with "Q"
    - Assert output contains a number with exactly two decimal places
    - **Validates: Requirements 3.6**

  - [x]* 2.6 Write property test: Movement aggregation correctly groups by type and direction
    - **Property 6: Movement aggregation correctly groups by type and direction**
    - Generate arbitrary log headers (with isInput flag) and associated log details
    - Assert totalEntryQuantity equals sum of quantities for input headers
    - Assert totalExitQuantity equals sum of quantities for output headers
    - Assert each type's totalQuantity equals sum of its detail quantities
    - **Validates: Requirements 4.1, 4.2**

  - [x]* 2.7 Write property test: Top categories ranking is correct
    - **Property 7: Top categories ranking is correct**
    - Generate movement records with at least 5 distinct types
    - Assert top 5 are ordered by descending total quantity
    - Assert every category in top 5 has total ≥ any category not in top 5
    - **Validates: Requirements 4.3**

  - [x]* 2.8 Write property test: Stock validation correctly accepts or rejects
    - Create `__tests__/unit/validation/stockValidation.property.test.ts`
    - **Property 8: Stock validation correctly accepts or rejects based on available stock**
    - Generate arbitrary non-negative stock and positive quantity
    - Assert validation rejects if and only if quantity > stock
    - **Validates: Requirements 6.1, 7.1, 7.4**

  - [x]* 2.9 Write property test: Stock validation error message contains all required information
    - **Property 9: Stock validation error message contains all required information**
    - Generate arbitrary product name, stock value, and quantity exceeding stock
    - Assert formatted error contains the quantity, stock, and product name
    - **Validates: Requirements 6.2**

  - [x]* 2.10 Write property test: Inline stock warning message format
    - **Property 10: Inline stock warning message format**
    - Generate arbitrary non-negative stock and quantity exceeding stock
    - Assert inline warning equals "Stock disponible: [stock]"
    - **Validates: Requirements 7.2**

  - [x]* 2.11 Write property test: First-failing product is reported on multi-product validation
    - **Property 11: First-failing product is reported on multi-product validation**
    - Generate list of product details where multiple exceed stock
    - Assert error references the first failing product's name, quantity, and stock
    - **Validates: Requirements 6.7**

- [x] 3. Checkpoint - Ensure foundational modules and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Apply theme to existing dashboard screens
  - [x] 4.1 Theme the DashboardInputScreen
    - Modify `src/screens/input/DashboardInputScreen.tsx`
    - Add `useTheme()` hook
    - Replace `appStyles.screen`, `appStyles.title`, `appStyles.textDark`, `appStyles.textCenter` with theme-derived styles using `theme.colors`, `theme.typography`
    - Apply `theme.colors.background` to container, `theme.colors.text` to text elements
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 4.2 Theme the DashboardOutputScreen
    - Modify `src/screens/output/DashboardOutputScreen.tsx`
    - Add `useTheme()` hook
    - Replace `appStyles.screen`, `appStyles.title`, `appStyles.textDark`, `appStyles.textCenter` with theme-derived styles using `theme.colors`, `theme.typography`
    - Apply `theme.colors.background` to container, `theme.colors.text` to text elements
    - _Requirements: 1.2, 1.4, 1.6_

- [x] 5. Create report screens and navigation
  - [x] 5.1 Update ProductStack navigation types and routes
    - Modify `src/interfaces/IProductNavigation.ts` to add `CriticalReport`, `SummaryReport`, `MovementReport` routes
    - Modify `src/stacks/ProductStack.tsx` to register the three new screens
    - _Requirements: 5.1, 5.3_

  - [x] 5.2 Create the ReportCard shared component
    - Create `src/components/ReportCard.tsx`
    - Accept `title` and `children` props
    - Style with `theme.colors.surface`, `theme.borderRadius.md`, `theme.elevation.low`
    - _Requirements: 2.7, 3.7, 4.6_

  - [x] 5.3 Create the CriticalReportScreen
    - Create `src/screens/reports/CriticalReportScreen.tsx`
    - Use `useFocusEffect` to load data via `getCriticalReportData()`
    - Display "Productos con stock bajo" section with low stock products
    - Display "Productos sin stock" section with zero stock products
    - Display "Productos más movidos" section with top 10 most moved
    - Show empty state messages when sections have no data
    - Apply all styling via `useTheme()` tokens
    - Display screen title "Reporte Crítico" as header
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.2_

  - [x] 5.4 Create the SummaryReportScreen
    - Create `src/screens/reports/SummaryReportScreen.tsx`
    - Use `useFocusEffect` to load data via `getSummaryReportData()`
    - Display "Total de productos" count
    - Display "Valor total del inventario" formatted with `formatCurrency()`
    - Display "Total de unidades en stock" count
    - Display stock distribution breakdown (0, 1-5, 6-20, 21-50, >50)
    - Apply all styling via `useTheme()` tokens
    - Display screen title "Resumen General" as header
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.2_

  - [x] 5.5 Create the MovementReportScreen
    - Create `src/screens/reports/MovementReportScreen.tsx`
    - Use `useFocusEffect` to load data via `getMovementReportData()`
    - Display entry vs exit quantity comparison
    - Display movement totals grouped by type
    - Display top 5 categories by total movement
    - Show empty state message "No hay movimientos registrados" when no data
    - Apply all styling via `useTheme()` tokens
    - Display screen title "Reporte de Movimientos" as header
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.2_

  - [x] 5.6 Add report navigation entry point to ProductListScreen
    - Modify `src/screens/product/ProductListScreen.tsx`
    - Add a "Reportes" button or menu that navigates to report screens
    - Use theme styling for the navigation element
    - _Requirements: 5.1_

- [x] 6. Checkpoint - Ensure report screens render and navigate correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integrate stock validation into output flow
  - [x] 7.1 Add submission-time stock validation to CreateOutputScreen
    - Modify `src/screens/output/CreateOutputScreen.tsx`
    - Before calling `createLog`, fetch current stock for all products in output details via ProductRepository
    - Call `validateStockForOutput()` with details and stock map
    - If invalid, show Toast with error message (type "error") and abort submission
    - If valid, proceed with `createLog()`
    - Handle stock query failure with generic error Toast
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 7.2 Add inline stock warnings to LogForm (output mode)
    - Modify `src/components/form/LogForm.tsx`
    - When a product quantity changes in output mode, call `checkStockForProduct()`
    - Display warning text "Stock disponible: [stock]" styled with `theme.colors.error` below the affected detail
    - Remove warning when quantity becomes valid
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The ReportService and StockValidator are pure logic modules testable in isolation
- All UI text is in Spanish per the app's locale

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10", "2.11", "4.1", "4.2"] },
    { "id": 2, "tasks": ["5.1", "5.2"] },
    { "id": 3, "tasks": ["5.3", "5.4", "5.5", "5.6"] },
    { "id": 4, "tasks": ["7.1", "7.2"] }
  ]
}
```
