# Implementation Plan: App Modernization

## Overview

This plan transforms the Papalia Inventory app into a well-structured, accessible, themed, performant, and secure application. Tasks are ordered to build foundational layers first (design tokens, theme system), then refactor architecture, add services, fix domain issues, improve UX, optimize performance, and finally standardize error handling. Each task builds incrementally on previous work.

## Tasks

- [x] 1. Set up design system tokens and theme infrastructure
  - [x] 1.1 Create design token modules
    - Create `src/design-system/tokens/colors.ts` with `ColorPalette` and `SemanticColors` interfaces and default values (primary, secondary, background, surface, error, success, warning + warehouse semantic colors)
    - Create `src/design-system/tokens/typography.ts` with `TypographyLevel` and `TypographyScale` interfaces (h1, h2, body, caption, overline)
    - Create `src/design-system/tokens/spacing.ts` with `SpacingScale` interface (xs:4, sm:8, md:16, lg:24, xl:32, xxl:48)
    - Create `src/design-system/tokens/elevation.ts` with `ElevationLevel` and `ElevationScale` interfaces (low, medium, high)
    - Create `src/design-system/tokens/borders.ts` with `BorderRadiusScale` interface (sm:4, md:8, lg:16)
    - Create `src/design-system/tokens/index.ts` as single entry point re-exporting all tokens
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 1.2 Create light and dark theme definitions
    - Create `src/design-system/themes/types.ts` with the `Theme` interface combining all token types plus text, textSecondary, border, disabled colors
    - Create `src/design-system/themes/light.ts` implementing the full `Theme` interface with light color values ensuring WCAG 4.5:1 contrast for text
    - Create `src/design-system/themes/dark.ts` implementing the full `Theme` interface with dark color values ensuring WCAG 4.5:1 contrast for text
    - _Requirements: 2.1, 4.5_

  - [x] 1.3 Implement ThemeContext and useTheme hook
    - Create `src/context/ThemeContext.tsx` with `ThemeContextValue` interface (theme, isDark, toggleTheme)
    - Implement theme persistence using the existing `Configuration` entity (key: `theme_preference`, value: `'light'` | `'dark'`)
    - Use `ConfigurationRepository` to read/write theme preference on toggle and on app launch
    - Default to light theme if no preference exists or if reading fails
    - Create `src/hooks/useTheme.ts` hook that consumes ThemeContext
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [x] 1.4 Write property tests for theme system (Properties 1, 2, 4)
    - Install `fast-check` as a dev dependency
    - Create `__tests__/unit/design-system/themes.property.test.ts`
    - **Property 1: Theme completeness** — verify both light and dark themes provide non-empty string values for all semantic color token keys
    - **Property 2: Theme toggle involution** — verify toggle(toggle(state)) === state
    - **Property 4: Color contrast compliance** — verify all text/background pairs meet WCAG 4.5:1 for normal text and 3:1 for large text
    - **Validates: Requirements 2.1, 2.3, 4.5**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Refactor component architecture and fix naming issues
  - [x] 3.1 Extract HeaderRight and HeaderLeft into dedicated files
    - Create `src/components/navigation/HeaderRight.tsx` extracting the component from `AppStartStack.tsx`
    - Create `src/components/navigation/HeaderLeft.tsx` extracting the component from `AppStartStack.tsx`
    - Update `AppStartStack.tsx` to import from the new files
    - Add `accessibilityLabel` and `accessibilityRole` to both components
    - _Requirements: 3.1, 3.2, 3.6, 4.1, 4.2_

  - [x] 3.2 Rename misspelled interface file and update imports
    - Rename `src/interfaces/IAppStartNavitgation.ts` to `src/interfaces/IAppStartNavigation.ts`
    - Update all import references across the codebase (AppStartStack.tsx and any other consumers)
    - _Requirements: 3.4_

  - [x] 3.3 Rename misspelled screens directory and update imports
    - Rename `src/screens/intput/` to `src/screens/input/`
    - Update all import references in `src/stacks/InputStack.tsx` and any other files importing from the old path
    - _Requirements: 7.3_

  - [x] 3.4 Move ProductItem to domain-specific folder
    - Move `src/components/ProductItem.tsx` to `src/components/product/ProductItem.tsx`
    - Update import in `ProductListScreen.tsx` and any other consumers
    - _Requirements: 3.3_

- [x] 4. Implement feedback components
  - [x] 4.1 Create Toast notification component
    - Create `src/components/feedback/Toast.tsx` implementing `ToastProps` interface (message, type, visible, onDismiss, duration)
    - Position at top of screen, auto-dismiss after 3 seconds, swipe-to-dismiss support
    - Use theme colors from `useTheme()` hook
    - Add accessibility: `accessibilityRole="alert"`, `accessibilityLiveRegion="polite"`
    - _Requirements: 8.5, 8.8, 4.1, 4.2_

  - [x] 4.2 Create SkeletonLoader component
    - Create `src/components/feedback/SkeletonLoader.tsx` implementing `SkeletonLoaderProps` interface
    - Support layouts: `product-list`, `log-list`, `dashboard`
    - Use theme colors for skeleton placeholder styling
    - _Requirements: 8.2_

  - [x] 4.3 Create EmptyState component
    - Create `src/components/feedback/EmptyState.tsx` implementing `EmptyStateProps` interface
    - Display icon, title, and description in Spanish
    - Use theme typography and spacing tokens
    - Add accessibility attributes
    - _Requirements: 8.7, 4.1_

  - [x] 4.4 Create ErrorBoundary component
    - Create `src/components/feedback/ErrorBoundary.tsx` implementing `ErrorBoundaryProps` interface
    - Catch unhandled JS errors, render recovery screen with Spanish error description and restart button
    - Integrate with LogService for error logging
    - _Requirements: 10.1, 10.5_

  - [x] 4.5 Write property test for ErrorBoundary (Property 11)
    - Create `__tests__/components/ErrorBoundary.property.test.tsx`
    - **Property 11: Error boundary catches and renders recovery UI**
    - Verify that for any Error thrown by a child, the boundary renders a recovery screen with Spanish description and restart button
    - **Validates: Requirements 10.1**

- [x] 5. Implement services layer
  - [x] 5.1 Create LogService
    - Create `src/services/LogService.ts` implementing the `LogService` interface
    - In-memory array capped at 100 entries (FIFO eviction)
    - Log entries include timestamp (ISO 8601), errorType, source, operation, message
    - Console output in `__DEV__` mode
    - _Requirements: 10.5_

  - [x] 5.2 Create FileService with cross-platform support
    - Create `src/services/FileService.ts` implementing the `FileService` interface
    - Resolve platform-specific paths: Downloads on Android, Documents on iOS
    - Handle permission requests using platform-appropriate APIs
    - Return user-friendly Spanish messages on permission denial
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 5.3 Create ExcelService replacing xlsx with exceljs
    - Install `exceljs` package, remove `xlsx` dependency from package.json
    - Create `src/services/ExcelService.ts` implementing the `ExcelService` interface
    - Implement `exportProducts()` producing XLSX with "Productos" sheet matching current column structure
    - Implement `exportLogs()` producing XLSX with "Entradas"/"Salidas" sheets
    - Implement `importProducts()` parsing XLSX into Product records with same field mapping
    - Use `FileService` for path resolution and file writing
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 5.4 Write property test for ExcelService (Property 5)
    - Create `__tests__/unit/services/ExcelService.property.test.ts`
    - **Property 5: Excel export/import round-trip preserves product data**
    - Verify that for any valid Product array, export then import produces equivalent records
    - **Validates: Requirements 5.2, 5.3**

  - [x] 5.5 Write property test for LogService (Property 12)
    - Create `__tests__/unit/services/LogService.property.test.ts`
    - **Property 12: User-facing error messages exclude technical details**
    - Verify sanitizeErrorMessage strips SQL, stack traces, class names, file paths
    - **Validates: Requirements 10.2, 10.5**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Database migration and error handling utilities
  - [x] 7.1 Create database migration for column rename
    - Create `src/database/migrations/RenameCommetsToComments1700000000001.ts`
    - Implement `up()`: ALTER TABLE log_header RENAME COLUMN commets TO comments
    - Implement `down()`: reverse the rename
    - Register migration in `DataSource.ts` configuration
    - Update `LogHeader` model to use `comments` column name
    - _Requirements: 7.2_

  - [x] 7.2 Implement database retry wrapper and error sanitization
    - Create `src/utils/withRetry.ts` implementing the retry pattern (initial + one retry with 500ms delay)
    - Create `src/utils/sanitizeErrorMessage.ts` stripping technical details (SQL, stack traces, class names, file paths)
    - Integrate LogService for error logging on final failure
    - _Requirements: 9.5, 10.2_

  - [x] 7.3 Write property tests for database utilities (Properties 6, 10)
    - Create `__tests__/unit/database/migrations.property.test.ts`
    - **Property 6: Database migration preserves comment data** — verify string values survive the column rename
    - Create `__tests__/unit/database/retry.property.test.ts`
    - **Property 10: Database retry executes exactly once before surfacing error** — verify exactly 2 attempts total, error surfaced only if both fail
    - **Validates: Requirements 7.2, 9.5**

- [x] 8. Performance optimization hooks
  - [x] 8.1 Create useDebounce hook
    - Create `src/hooks/useDebounce.ts` implementing a generic debounce hook with configurable delay (default 300ms)
    - _Requirements: 9.2_

  - [x] 8.2 Add pagination to useProducts hook
    - Modify `src/hooks/useProducts.ts` to support pagination (page size 20) when total products > 50
    - Add `loadMore()` function triggered by `onEndReached` in FlatList
    - Integrate `useDebounce` for search input
    - Replace `Alert.alert` error handling with LogService + Toast pattern
    - Add FlatList performance props: `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`
    - _Requirements: 9.1, 9.2, 9.3, 9.6_

  - [x] 8.3 Write property tests for pagination and debounce (Properties 8, 9)
    - Create `__tests__/unit/hooks/useDebounce.property.test.ts`
    - **Property 9: Debounce suppresses intermediate calls** — verify exactly one query fires for N events within 300ms
    - Create `__tests__/integration/pagination.property.test.ts`
    - **Property 8: Pagination returns bounded page sizes** — verify at most 20 items per page, correct total pages
    - **Validates: Requirements 9.1, 9.2**

- [x] 9. Form validation and type selection enforcement
  - [x] 9.1 Implement form validation for type selection
    - Update form validation logic in `src/hooks/useForm.ts` (or create validation utility) to reject type === 0
    - Ensure validation returns Spanish error message and prevents submission
    - Announce validation errors to accessibility services via `accessibilityLiveRegion`
    - _Requirements: 7.6, 4.8_

  - [x] 9.2 Write property test for form validation (Property 7)
    - Create `__tests__/unit/validation/formValidation.property.test.ts`
    - **Property 7: Type selection validation rejects unselected value** — verify type=0 always produces validation error regardless of other fields
    - **Validates: Requirements 7.6**

- [x] 10. Accessibility compliance across all interactive elements
  - [x] 10.1 Add accessibility attributes to ProductItem and list components
    - Add `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` to `ProductItem.tsx`
    - For zero-stock products, add `accessibilityHint` indicating depleted inventory
    - Add content descriptions for product images including product name
    - Ensure minimum 44x44dp touch targets
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 10.2 Add accessibility attributes to navigation, forms, and buttons
    - Add `accessibilityLabel` (Spanish) and `accessibilityRole` to all buttons (Fab, TouchableButton)
    - Add accessibility to form inputs (InputSearch, date pickers, select dropdowns)
    - Add `accessibilityRole="header"` to section titles
    - Ensure logical focus order on all screens
    - _Requirements: 4.1, 4.2, 4.7_

  - [x] 10.3 Write property test for zero-stock accessibility (Property 3)
    - Create `__tests__/components/ProductItem.test.tsx`
    - **Property 3: Zero-stock products carry accessibility hint** — verify any Product with stock===0 renders with accessibilityHint about depleted status
    - **Validates: Requirements 4.4**

- [x] 11. Integrate theme system and modernize UI across screens
  - [x] 11.1 Wrap App with ThemeProvider and ErrorBoundary
    - Update `App.tsx` to wrap with `ErrorBoundary` → `ThemeProvider` → existing `NavigationContainer`
    - Replace hardcoded loading screen with themed version using SkeletonLoader
    - Add database initialization error screen with retry button (Spanish text)
    - _Requirements: 2.4, 10.1, 10.3, 10.4_

  - [x] 11.2 Add Theme Toggle to navigation header
    - Update `HeaderRight.tsx` to include a theme toggle button (sun/moon icon)
    - Wire toggle to `ThemeContext.toggleTheme()`
    - Add accessibility label: "Cambiar tema"
    - _Requirements: 2.6, 4.1_

  - [x] 11.3 Apply theme to ProductListScreen and product components
    - Replace `appStyles`/`appColors` usage with `useTheme()` hook values
    - Apply elevation tokens to ProductItem cards
    - Apply border radius tokens
    - Integrate SkeletonLoader for loading state
    - Integrate EmptyState for empty product list
    - Integrate Toast for download success/error feedback
    - Update Excel download to use new ExcelService
    - _Requirements: 8.1, 8.2, 8.5, 8.7, 2.3_

  - [x] 11.4 Apply theme to Input/Output screens and PrincipalStack
    - Update `PrincipalStack.tsx` tab navigator to use theme colors
    - Update Input list/create/read screens to use theme tokens
    - Update Output list/create/read screens to use theme tokens
    - Apply Toast for form submission success feedback
    - Apply inline error messages for validation failures
    - _Requirements: 8.5, 8.6, 2.3_

  - [x] 11.5 Apply theme to ConfigurationScreen
    - Update ConfigurationScreen to use theme tokens
    - Replace `Alert.alert` calls with Toast notifications
    - _Requirements: 2.3_

- [x] 12. Update ProductListScreen with pagination and pull-to-refresh
  - [x] 12.1 Wire pagination and performance optimizations into ProductListScreen
    - Use updated `useProducts` hook with pagination support
    - Add `onEndReached` handler for loading more products
    - Apply `React.memo` to ProductItem
    - Use debounced search via `useDebounce`
    - Add themed `RefreshControl` for pull-to-refresh
    - Implement lazy image loading (only load images near visible area)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7, 8.3_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using `fast-check`
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout — all implementations use TypeScript
- The existing `globalStyles.ts` is kept for backward compatibility and gradually replaced by theme tokens
- The `xlsx` dependency is replaced by `exceljs` in task 5.3

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "3.2", "3.3"] },
    { "id": 2, "tasks": ["1.3", "3.1", "3.4"] },
    { "id": 3, "tasks": ["1.4", "4.1", "4.2", "4.3", "5.1"] },
    { "id": 4, "tasks": ["4.4", "5.2", "8.1"] },
    { "id": 5, "tasks": ["4.5", "5.3", "5.5", "7.1", "7.2"] },
    { "id": 6, "tasks": ["5.4", "7.3", "8.2", "9.1"] },
    { "id": 7, "tasks": ["8.3", "9.2", "10.1", "10.2"] },
    { "id": 8, "tasks": ["10.3", "11.1", "11.2"] },
    { "id": 9, "tasks": ["11.3", "11.4", "11.5"] },
    { "id": 10, "tasks": ["12.1"] }
  ]
}
```
