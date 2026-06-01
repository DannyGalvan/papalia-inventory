# Requirements Document

## Introduction

This feature enhances the Papalia Inventory React Native app with three capabilities: (1) applying the existing light/dark theme system to the current DashboardInputScreen and DashboardOutputScreen, (2) creating new report/dashboard screens that present summarized inventory information (critical alerts, general summary, movement reports), and (3) adding stock validation to prevent negative inventory when creating output (salida) records. All new and modified screens use the existing `useTheme()` hook and theme system. The app is in Spanish for a Guatemala warehouse domain.

## Glossary

- **App**: The Papalia Inventory React Native application for warehouse (bodega) inventory management
- **Theme_System**: The existing design system providing `useTheme()` hook with `theme.colors`, `theme.typography`, `theme.spacing`, `theme.elevation`, and `theme.borderRadius` tokens for light and dark modes
- **DashboardInputScreen**: The existing screen that displays grouped totals of inventory entries (entradas) by type
- **DashboardOutputScreen**: The existing screen that displays grouped totals of inventory exits (salidas) by type
- **Product**: A database entity with fields: code, name, description, price, stock, image
- **LogHeader**: A database entity representing an inventory movement header with fields: id, type, comments, createdAt, isInput
- **LogDetail**: A database entity representing an inventory movement line item with fields: id, productCode, logHeaderId, name, quantity, price, total
- **Output_Form**: The CreateOutputScreen form used to register inventory exits (salidas) with product selection and quantity entry
- **Stock**: The integer field on a Product representing current available inventory quantity
- **Critical_Report_Screen**: A new screen displaying critical inventory alerts including low stock, zero stock, and most moved products
- **Summary_Report_Screen**: A new screen displaying general inventory summary including total products, total value, and stock distribution
- **Movement_Report_Screen**: A new screen displaying movement reports including entries vs exits over time and top categories
- **Stock_Validator**: The validation logic that checks whether a requested output quantity exceeds available product stock

## Requirements

### Requirement 1: Theme Application to Existing Dashboard Screens

**User Story:** As a warehouse operator, I want the existing dashboard screens to respect my light/dark theme preference, so that the interface is consistent and comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. WHEN the DashboardInputScreen renders, THE App SHALL apply colors from `theme.colors` obtained via the `useTheme()` hook to all text, background, and container elements
2. WHEN the DashboardOutputScreen renders, THE App SHALL apply colors from `theme.colors` obtained via the `useTheme()` hook to all text, background, and container elements
3. WHEN the user toggles the theme preference, THE DashboardInputScreen SHALL update all styled elements to reflect the new theme colors without requiring navigation away from the screen
4. WHEN the user toggles the theme preference, THE DashboardOutputScreen SHALL update all styled elements to reflect the new theme colors without requiring navigation away from the screen
5. THE DashboardInputScreen SHALL use `theme.typography` for font sizes and weights on all text elements
6. THE DashboardOutputScreen SHALL use `theme.typography` for font sizes and weights on all text elements

### Requirement 2: Critical Inventory Report Screen

**User Story:** As a warehouse manager, I want to see critical inventory alerts at a glance, so that I can quickly identify products that need restocking or attention.

#### Acceptance Criteria

1. THE Critical_Report_Screen SHALL display a list of products where Stock is less than or equal to 5 units, labeled as "Productos con stock bajo"
2. THE Critical_Report_Screen SHALL display a list of products where Stock equals 0, labeled as "Productos sin stock"
3. THE Critical_Report_Screen SHALL display the top 10 most moved products ranked by total quantity across all LogDetail records, labeled as "Productos más movidos"
4. WHEN no products meet the low stock threshold, THE Critical_Report_Screen SHALL display an empty state message "No hay productos con stock bajo"
5. WHEN no products have zero stock, THE Critical_Report_Screen SHALL display an empty state message "No hay productos sin stock"
6. WHEN the Critical_Report_Screen loads, THE App SHALL query the Product and LogDetail tables to compute the displayed data
7. THE Critical_Report_Screen SHALL apply all styling using tokens from the Theme_System via the `useTheme()` hook

### Requirement 3: General Inventory Summary Screen

**User Story:** As a warehouse manager, I want to see a general summary of my inventory, so that I can understand the overall state of the warehouse at a glance.

#### Acceptance Criteria

1. THE Summary_Report_Screen SHALL display the total count of products registered in the database, labeled as "Total de productos"
2. THE Summary_Report_Screen SHALL display the total inventory value calculated as the sum of (price × stock) for all products, labeled as "Valor total del inventario"
3. THE Summary_Report_Screen SHALL display the total units in stock calculated as the sum of stock for all products, labeled as "Total de unidades en stock"
4. THE Summary_Report_Screen SHALL display a stock distribution breakdown showing the count of products in each range: 0 units, 1-5 units, 6-20 units, 21-50 units, and more than 50 units
5. WHEN the Summary_Report_Screen loads, THE App SHALL query the Product table to compute all summary values
6. THE Summary_Report_Screen SHALL format monetary values with the prefix "Q" and two decimal places
7. THE Summary_Report_Screen SHALL apply all styling using tokens from the Theme_System via the `useTheme()` hook

### Requirement 4: Movement Report Screen

**User Story:** As a warehouse manager, I want to see reports of inventory movements over time, so that I can identify trends and understand which categories have the most activity.

#### Acceptance Criteria

1. THE Movement_Report_Screen SHALL display a summary comparing total entry (entrada) quantities versus total exit (salida) quantities
2. THE Movement_Report_Screen SHALL display movement totals grouped by LogHeader type, showing the type name and total quantity for each
3. THE Movement_Report_Screen SHALL display the top 5 categories (LogHeader types) ranked by total movement quantity across entries and exits
4. WHEN no movement records exist, THE Movement_Report_Screen SHALL display an empty state message "No hay movimientos registrados"
5. WHEN the Movement_Report_Screen loads, THE App SHALL query the LogHeader and LogDetail tables to compute movement data
6. THE Movement_Report_Screen SHALL apply all styling using tokens from the Theme_System via the `useTheme()` hook

### Requirement 5: Report Screen Navigation

**User Story:** As a warehouse operator, I want to access the new report screens easily, so that I can view inventory information without complex navigation.

#### Acceptance Criteria

1. THE App SHALL provide navigation access to the Critical_Report_Screen, Summary_Report_Screen, and Movement_Report_Screen from within the existing tab structure
2. WHEN the user navigates to a report screen, THE App SHALL display the screen title in Spanish as a header element
3. THE App SHALL allow the user to navigate back from any report screen to the previous screen

### Requirement 6: Stock Validation on Output Creation

**User Story:** As a warehouse operator, I want the system to prevent me from creating an output that exceeds available stock, so that inventory records remain accurate and stock never goes negative.

#### Acceptance Criteria

1. WHEN the user submits the Output_Form, THE Stock_Validator SHALL verify that for each product in the output details, the requested quantity does not exceed the product current Stock value
2. IF the requested quantity for any product exceeds the available Stock, THEN THE Stock_Validator SHALL prevent form submission and display an error message in Spanish: "La cantidad solicitada ([cantidad]) excede el stock disponible ([stock]) para el producto [nombre]"
3. THE Stock_Validator SHALL perform validation before calling the `createLog` repository function
4. WHEN validation fails, THE Output_Form SHALL remain in its current state with all user-entered data preserved
5. WHEN validation fails, THE Output_Form SHALL display the error message using the Toast component with type "error"
6. THE Stock_Validator SHALL query the current Stock value from the database at validation time to ensure accuracy
7. IF multiple products in the same output fail validation, THEN THE Stock_Validator SHALL report the first product that fails validation

### Requirement 7: Stock Validation for Quantity Changes

**User Story:** As a warehouse operator, I want immediate feedback when I enter a quantity that exceeds stock, so that I can correct it before attempting to submit.

#### Acceptance Criteria

1. WHEN the user modifies the quantity of a product in the Output_Form details, THE Stock_Validator SHALL check whether the new quantity exceeds the available Stock for that product
2. IF the entered quantity exceeds available Stock, THEN THE Output_Form SHALL display a warning message near the affected product detail: "Stock disponible: [stock]"
3. THE Output_Form SHALL style the warning message using `theme.colors.error` from the Theme_System
4. WHEN the user reduces the quantity to a valid value, THE Output_Form SHALL remove the warning message

