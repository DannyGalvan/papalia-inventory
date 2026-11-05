import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('../../../src/hooks/useTheme', () => {
  const { lightTheme: theme } = require('../../../src/design-system/themes');
  const value = { theme, isDark: false, toggleTheme: jest.fn() };
  return { useTheme: () => value, default: () => value };
});
jest.mock('typeorm', () => require('../../helpers/typeormDecoratorsMock'));

import { ProductItem } from '../../../src/components/product/ProductItem';
import { Product } from '../../../src/database/models/Product';

const product = (sku: unknown) =>
  Object.assign(new Product(), {
    code: 'PRD-000001',
    sku,
    name: 'Café',
    description: 'd',
    price: 10,
    cost: 0,
    stock: 3,
    image: '',
  });

const render = (p: Product) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<ProductItem product={p} />);
  });
  return renderer;
};

const texts = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(Text)
    .map(node => [node.props.children].flat().join(''));

const label = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'button')[0]
    .props.accessibilityLabel as string;

describe('ProductItem SKU', () => {
  it('shows the supplier SKU next to the generated code', () => {
    const renderer = render(product('ABC-123'));
    expect(texts(renderer)).toEqual(
      expect.arrayContaining(['Código: PRD-000001', 'SKU: ABC-123']),
    );
    expect(label(renderer)).toContain('código PRD-000001, SKU ABC-123');
  });

  it.each(['', undefined, { isNitroSQLiteNull: true }])(
    'hides the SKU line when there is none (%p)',
    sku => {
      const renderer = render(product(sku));
      expect(texts(renderer).some(t => t.startsWith('SKU'))).toBe(false);
      expect(label(renderer)).not.toContain('SKU');
    },
  );
});
