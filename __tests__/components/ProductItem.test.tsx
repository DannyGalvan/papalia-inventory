/**
 * Property-based tests for the ProductItem component.
 *
 * Feature: app-modernization
 *   Property 3: Zero-stock products carry accessibility hint — for any
 *               Product with stock === 0, when rendered as a ProductItem
 *               component, the output must include an accessibilityHint
 *               string that communicates the depleted inventory status.
 *
 * Validates: Requirements 4.4
 *
 * The property runs a minimum of 100 iterations via fast-check.
 *
 * Uses react-test-renderer (the project's configured renderer), matching the
 * pattern in ErrorBoundary.property.test.tsx and Toast.test.tsx.
 */

import fc from 'fast-check';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock @react-navigation/native before importing the component.
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  NavigationProp: {},
}));

// Mock useTheme to provide real light theme tokens without requiring a
// ThemeProvider (which depends on the database via ConfigurationRepository).
jest.mock('../../src/hooks/useTheme', () => {
  const {lightTheme: theme} = require('../../src/design-system/themes');
  const value = {theme, isDark: false, toggleTheme: jest.fn()};
  return {
    useTheme: () => value,
    default: () => value,
  };
});

// Mock typeorm decorators so the Product model can be imported without a DB.
jest.mock('typeorm', () => ({
  Entity: () => () => {},
  PrimaryColumn: () => () => {},
  Column: () => () => {},
  OneToMany: () => () => {},
  ManyToOne: () => () => {},
  JoinColumn: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
}));

import { ProductItem } from '../../src/components/product/ProductItem';
import { Product } from '../../src/database/models/Product';

// ---------------------------------------------------------------------------
// Expected accessibility hint for zero-stock products (Req 4.4).
// Kept in sync with src/components/product/ProductItem.tsx.
// ---------------------------------------------------------------------------
const ZERO_STOCK_HINT =
  'Producto sin inventario disponible. Toca dos veces para editar el producto.';
const NON_ZERO_STOCK_HINT = 'Toca dos veces para editar el producto.';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary that produces a valid Product with stock === 0. */
const zeroStockProductArb = fc
  .record({
    code: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 100 }),
    price: fc.float({ min: 0, max: 99999, noNaN: true }),
    image: fc.string({ maxLength: 200 }),
  })
  .map(fields => {
    const product = new Product();
    product.code = fields.code;
    product.name = fields.name;
    product.description = fields.description;
    product.price = fields.price;
    product.stock = 0;
    product.image = fields.image;
    product.logDetails = [];
    return product;
  });

/** Arbitrary that produces a valid Product with stock > 0. */
const nonZeroStockProductArb = fc
  .record({
    code: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 100 }),
    price: fc.float({ min: 0, max: 99999, noNaN: true }),
    stock: fc.integer({ min: 1, max: 99999 }),
    image: fc.string({ maxLength: 200 }),
  })
  .map(fields => {
    const product = new Product();
    product.code = fields.code;
    product.name = fields.name;
    product.description = fields.description;
    product.price = fields.price;
    product.stock = fields.stock;
    product.image = fields.image;
    product.logDetails = [];
    return product;
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render an element with act(), returning the renderer. */
const render = (ui: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(ui);
  });
  return renderer;
};

describe('Feature: app-modernization, Property 3: Zero-stock products carry accessibility hint', () => {
  it('renders accessibilityHint indicating depleted status for any product with stock === 0', () => {
    fc.assert(
      fc.property(zeroStockProductArb, product => {
        const renderer = render(<ProductItem product={product} />);

        // The root TouchableOpacity should carry the zero-stock hint.
        const buttons = renderer.root.findAll(
          node => node.props.accessibilityRole === 'button',
        );
        expect(buttons.length).toBeGreaterThan(0);

        const hint = buttons[0].props.accessibilityHint;
        expect(hint).toBe(ZERO_STOCK_HINT);

        ReactTestRenderer.act(() => {
          renderer.unmount();
        });
      }),
      { numRuns: 100 },
    );
  });

  it('renders a different accessibilityHint for any product with stock > 0 (no depleted message)', () => {
    fc.assert(
      fc.property(nonZeroStockProductArb, product => {
        const renderer = render(<ProductItem product={product} />);

        const buttons = renderer.root.findAll(
          node => node.props.accessibilityRole === 'button',
        );
        expect(buttons.length).toBeGreaterThan(0);

        const hint = buttons[0].props.accessibilityHint;
        // Non-zero stock should NOT carry the depleted hint.
        expect(hint).toBe(NON_ZERO_STOCK_HINT);
        expect(hint).not.toContain('sin inventario');

        ReactTestRenderer.act(() => {
          renderer.unmount();
        });
      }),
      { numRuns: 100 },
    );
  });
});
