# Requirements Document

## Introduction

Comprehensive modernization of the Papalia Inventory warehouse management application. This feature encompasses a global style overhaul using a "liquid" design system, light/dark theme support, improved accessibility, dependency updates (addressing security vulnerabilities), code architecture refactoring, and cross-platform optimization for Android and iOS.

## Glossary

- **App**: The Papalia Inventory React Native mobile application for warehouse (bodega) inventory control
- **Design_System**: The "liquid" visual design system providing consistent spacing, typography, colors, elevation, and component styles across the App
- **Theme_Provider**: The React context-based system that manages and distributes the active theme (light or dark) to all components
- **Theme_Toggle**: A UI control that allows the user to switch between light and dark visual themes
- **Product**: A warehouse item with code, name, description, price, stock quantity, and optional image
- **Log_Entry**: A record of inventory movement (input or output) consisting of a LogHeader and associated LogDetails
- **Input**: An inventory entry representing stock additions (purchases, returns, extraordinary purchases, other concepts)
- **Output**: An inventory exit representing stock reductions (sales, extraordinary, gifts to bosses/workers/clients/providers)
- **Excel_Exporter**: The module responsible for generating Excel spreadsheet files from inventory data
- **Navigation_Stack**: A React Navigation stack managing screen transitions and header configuration
- **Accessibility_Service**: Platform-provided assistive technology (VoiceOver on iOS, TalkBack on Android)

## Requirements

### Requirement 1: Liquid Design System Foundation

**User Story:** As a developer, I want a centralized design system with design tokens, so that all screens share consistent visual styling aligned with the warehouse domain.

#### Acceptance Criteria

1. THE Design_System SHALL define design tokens covering: a color palette of at least 5 base colors (primary, secondary, background, surface, error), a typography scale of at least 5 levels each specifying fontSize, fontWeight, and lineHeight, a spacing scale of at least 5 levels based on a consistent base unit, at least 3 border radius levels, and at least 3 elevation levels
2. THE Design_System SHALL provide semantic color tokens for the following warehouse domain concepts: stock-available, stock-depleted, entry-movement, exit-movement, success-feedback, warning-feedback, and error-feedback
3. WHEN a component renders, THE Design_System SHALL supply styles that produce equivalent visual spacing, font sizes, and color values on both Android and iOS without requiring platform-conditional overrides in consuming components
4. THE Design_System SHALL expose a typed TypeScript interface for all design tokens to enable compile-time validation
5. THE Design_System SHALL organize all token definitions in a single importable module so that consuming components access tokens from one entry point

### Requirement 2: Light and Dark Theme Support

**User Story:** As a warehouse operator, I want to switch between light and dark themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Theme_Provider SHALL supply a light theme and a dark theme, each providing color values for every semantic color token defined in the Design_System (including background, surface, text, border, stock-available, stock-depleted, entry-movement, and exit-movement tokens)
2. THE Theme_Provider SHALL persist the selected theme preference to device storage within 1 second of the user making a selection so the selection survives app restarts
3. WHEN the user activates the Theme_Toggle, THE Theme_Provider SHALL switch all rendered components to the alternate theme within 500 milliseconds without requiring an app restart
4. WHEN the App launches, THE Theme_Provider SHALL restore the previously selected theme from device storage before rendering the first screen
5. IF no persisted theme preference exists, THEN THE Theme_Provider SHALL default to the light theme
6. THE Theme_Toggle SHALL be accessible from the main navigation header on all screens managed by the Navigation_Stack
7. IF reading the persisted theme preference from device storage fails, THEN THE Theme_Provider SHALL default to the light theme and allow the user to continue using the App without interruption

### Requirement 3: Component Architecture Refactoring

**User Story:** As a developer, I want each component in its own file with clear separation of concerns, so that the codebase is maintainable and navigable.

#### Acceptance Criteria

1. THE App SHALL contain exactly one React component per file, where a component is defined as any named function or arrow function that returns JSX and is either exported or used as a value passed to navigation options (e.g., headerRight, headerLeft)
2. WHEN a file currently contains multiple component definitions (e.g., HeaderRight and HeaderLeft in AppStartStack.tsx), THE App SHALL extract each additional component into a dedicated file within the same directory as the original file
3. THE App SHALL organize shared components following the pattern: src/components/{domain}/{ComponentName}.tsx, where {domain} corresponds to the feature area the component supports (e.g., button, form, input, navigation)
4. THE App SHALL define navigation type interfaces in dedicated files under src/interfaces/ with correct spelling, renaming any misspelled files to their corrected form (e.g., rename "IAppStartNavitgation.ts" to "IAppStartNavigation.ts") and updating all import references accordingly
5. WHEN a component file contains inline style objects with more than 5 properties, THE App SHALL extract those styles into a co-located StyleSheet.create call within the same file, or into the existing src/styles/globalStyles.ts file if the styles are reused across 2 or more components
6. THE App SHALL export each component using the same export style (named or default) that the original component used before extraction

### Requirement 4: Accessibility Compliance

**User Story:** As a warehouse operator using assistive technology, I want the app to be fully accessible, so that I can manage inventory regardless of visual or motor ability.

#### Acceptance Criteria

1. THE App SHALL provide accessibilityLabel attributes in Spanish on all interactive elements (buttons, inputs, list items, navigation controls) describing the element's purpose or current value
2. THE App SHALL provide accessibilityRole attributes on all interactive elements matching their semantic purpose (e.g., "button" for pressable actions, "adjustable" for sliders, "header" for section titles)
3. THE App SHALL support minimum touch target sizes of 44x44 density-independent pixels on all interactive elements
4. WHEN a Product has zero stock, THE App SHALL communicate the depleted status through accessibilityHint indicating that the product has no available inventory, in addition to the visual color indicator
5. THE App SHALL maintain a minimum color contrast ratio of 4.5:1 for normal text (below 18pt regular or 14pt bold) and 3:1 for large text (18pt regular or 14pt bold and above) in both light and dark themes
6. WHEN the Accessibility_Service is active, THE App SHALL provide content descriptions for all Product images that include the product name and a description of the image content
7. THE App SHALL arrange focus order in a logical top-to-bottom, start-to-end reading sequence on all screens so that Accessibility_Service navigation follows the visual layout order
8. WHEN a form validation error occurs, THE App SHALL announce the error message to the Accessibility_Service so the user is informed without requiring visual confirmation

### Requirement 5: Dependency Security and Updates

**User Story:** As a developer, I want all dependencies updated and free of known high-severity vulnerabilities, so that the app remains secure and maintainable.

#### Acceptance Criteria

1. THE App SHALL replace the xlsx dependency (version 0.20.3 with HIGH severity vulnerabilities) with an alternative that reports zero HIGH or CRITICAL severity vulnerabilities when audited via `npm audit`
2. THE App SHALL produce XLSX export files containing the same sheet names ("Productos", "Entradas", "Salidas") and the same column data (derived from Product, LogHeader, and LogDetail model fields) as the current xlsx 0.20.3 implementation
3. THE App SHALL import XLSX files selected by the user via the document picker and parse them into Product records with the same field mapping (code, name, description, price, stock, image) as the current xlsx 0.20.3 implementation
4. THE App SHALL update all dependencies to their latest compatible versions that maintain React Native 0.82.x compatibility
5. WHEN a dependency update introduces a breaking change, THE App SHALL adapt the affected code so that all existing screens render and all existing user workflows (product CRUD, input/output log creation, Excel export, Excel import) complete without error
6. THE App SHALL compile without TypeScript errors after all dependency updates are applied
7. THE App SHALL launch on an Android device or emulator and navigate to each main screen (Products, Inputs, Outputs, Configuration) without runtime crashes after all dependency updates are applied

### Requirement 6: Cross-Platform Compatibility

**User Story:** As a product owner, I want the app to work identically on Android and iOS, so that all warehouse operators can use the app regardless of device.

#### Acceptance Criteria

1. THE App SHALL render all screens with matching visual hierarchy, element ordering, and interactive behavior on both Android (API 24+) and iOS (15.1+), such that no UI element is missing, clipped, or non-functional on either platform
2. THE App SHALL resolve platform-specific file system paths for image storage and Excel export such that files written are subsequently readable by the App and accessible to the user through the device file manager on both Android and iOS
3. WHEN the user exports an Excel file, THE Excel_Exporter SHALL save the file to the platform downloads directory (Downloads folder on Android, Documents directory on iOS) and confirm the file exists at the resolved path before reporting success
4. THE App SHALL request storage permissions using platform-appropriate APIs (Scoped Storage on Android 10+, Photo Library on iOS) prior to any file operation that requires them
5. IF the user denies a storage permission request, THEN THE App SHALL display a message in Spanish explaining which feature is unavailable due to the missing permission and SHALL NOT crash or leave the user on a non-functional screen
6. THE Navigation_Stack SHALL use the default platform navigation transitions and header styles provided by React Navigation's native-stack navigator on each platform without custom overrides that break platform conventions

### Requirement 7: Business Domain Alignment

**User Story:** As a warehouse manager, I want the app terminology and logic to accurately reflect bodega operations, so that the interface matches real-world workflows.

#### Acceptance Criteria

1. THE App SHALL display all user-facing labels, placeholders, and messages in Spanish using warehouse (bodega) domain terminology as established in the existing UI text patterns
2. THE App SHALL rename the database column "commets" to "comments" in the LogHeader model via a database migration that preserves all existing data in the column
3. THE App SHALL rename the directory "intput" to "input" in the screens folder structure and update all corresponding import references
4. WHEN displaying Output types, THE App SHALL present the complete list: Venta, Extraordinaria, Regalo para jefes, Regalo para trabajadores, Regalo para clientes, Regalo para proveedores
5. WHEN displaying Input types, THE App SHALL present the complete list: Compra de inventario, Devolución, Compra extraordinaria, Otros conceptos
6. IF the user attempts to submit an Output or Input form with the type selection equal to "no seleccionado" (value 0), THEN THE App SHALL prevent form submission and display a validation error message indicating that a type selection is required
7. WHEN displaying Output or Input type selection dropdowns, THE App SHALL show "Seleccione una opción" as the default unselected option

### Requirement 8: UI/UX Modernization

**User Story:** As a warehouse operator, I want a modern, fluid interface with smooth interactions, so that daily inventory tasks feel efficient and pleasant.

#### Acceptance Criteria

1. THE App SHALL apply rounded corners (border radius from Design_System) and elevation shadows (using Design_System elevation tokens) to all card-style components (ProductItem, LogItems, DashboardItem)
2. THE App SHALL provide visual loading states with skeleton placeholders that mirror the layout of the expected content instead of plain ActivityIndicator spinners during data fetches on list screens (ProductListScreen, InputListScreen, OutputListScreen, DashboardInputScreen, DashboardOutputScreen)
3. WHEN the user pulls to refresh a list, THE App SHALL display a themed refresh indicator using colors from the active theme provided by Theme_Provider
4. THE App SHALL animate screen transitions using the platform-native animation drivers (Animated API or react-native-reanimated) with a duration between 200 and 400 milliseconds
5. WHEN a form submission succeeds, THE App SHALL display a themed success toast notification that auto-dismisses after 3 seconds and does not block user interaction with the underlying screen
6. WHEN a form submission fails due to a validation or server error, THE App SHALL display an inline error message in Spanish directly below the relevant field, and the message SHALL remain visible until the user modifies the field value
7. THE App SHALL display empty state illustrations with descriptive text in Spanish indicating what the list will contain and how to add items, when product, input, or output lists contain zero items
8. WHEN a toast notification is displayed, THE App SHALL position it at the top of the screen and allow the user to dismiss it early by swiping

### Requirement 9: Logic and Performance Optimization

**User Story:** As a warehouse operator, I want the app to respond quickly even with large inventories, so that I can work efficiently during busy periods.

#### Acceptance Criteria

1. IF the product list contains more than 50 items, THEN THE App SHALL render items using pagination with a page size of 20 items or virtual scrolling that renders only the visible items plus a 10-item buffer
2. WHEN the user searches for products, THE App SHALL debounce search input by 300 milliseconds to avoid excessive database queries
3. THE App SHALL memoize list rendering components and data transformation functions for product lists, input logs, and output logs using React.memo, useMemo, or useCallback
4. WHEN loading product images, THE App SHALL implement lazy loading so that only images within or immediately adjacent to the visible scroll area are loaded into memory
5. IF a database query fails, THEN THE App SHALL retry the operation once within 1 second before displaying an error message to the user
6. WHEN a single product's data changes, THE App SHALL re-render only the affected product item without re-rendering the entire product list
7. WHEN the product list is rendered with 500 or more items, THE App SHALL maintain a scroll frame rate of at least 30 frames per second on devices meeting the minimum supported OS versions (Android API 24+, iOS 15.1+)

### Requirement 10: Error Handling Standardization

**User Story:** As a warehouse operator, I want clear and consistent error feedback, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. THE App SHALL implement a centralized error boundary component that catches unhandled JavaScript errors and displays a recovery screen containing an error description in Spanish and a button to restart the App
2. WHEN a network or database error occurs, THE App SHALL display an error message in Spanish that describes the failed operation (e.g., "No se pudo guardar el producto") without exposing technical stack traces, class names, or SQL statements
3. IF the database initialization fails on app launch, THEN THE App SHALL display an error screen in Spanish indicating that the database could not be started, and provide a retry button that re-attempts the initialization
4. IF the database initialization retry fails, THEN THE App SHALL display the same error screen with the retry button remaining available for subsequent attempts
5. THE App SHALL log all caught errors with timestamp (ISO 8601 format), error type, source screen or component name, and the operation that was being performed when the error occurred
6. WHEN an image fails to load for a Product, THE App SHALL display the default placeholder image (sin_imagen.png) without crashing
