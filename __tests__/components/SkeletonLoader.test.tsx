/**
 * Unit tests for the SkeletonLoader feedback component.
 *
 * Verifies that each supported layout (`product-list`, `log-list`,
 * `dashboard`) renders the requested number of placeholder cards, that the
 * `count` prop is honored (and guarded against invalid values), and that the
 * component exposes accessibility metadata indicating a busy/loading state.
 * The component is wrapped in a ThemeContext.Provider with the light theme so
 * it consumes real theme tokens without the database-backed ThemeProvider.
 *
 * Requirements: 8.2
 */

import React from 'react';
import { Animated, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

// The theme import chain (useTheme -> ThemeContext -> ConfigurationRepository
// -> DataSource -> typeorm + native SQLite driver) cannot load in the Jest
// environment. Stub the repository module so the theme context can be
// imported without pulling in the native/ESM database stack.
jest.mock('../../src/database/repository/ConfigurationRepository', () => ({
  ConfigurationRepository: {create: jest.fn()},
  createConfiguration: jest.fn(),
  getConfigurationByKey: jest.fn(),
  updateConfiguration: jest.fn(),
}));

import {
    SkeletonLoader,
    SkeletonLoaderProps,
} from '../../src/components/feedback/SkeletonLoader';
import { ThemeContext, ThemeContextValue } from '../../src/context/ThemeContext';
import { lightTheme } from '../../src/design-system/themes';

const themeValue: ThemeContextValue = {
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
};

const renderSkeleton = (props: SkeletonLoaderProps) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <ThemeContext.Provider value={themeValue}>
        <SkeletonLoader {...props} />
      </ThemeContext.Provider>,
    );
  });
  renderers.push(renderer);
  return renderer;
};

// Track rendered trees so they can be unmounted after each test. The skeleton
// runs an infinite Animated.loop; unmounting triggers its cleanup so no timers
// leak between tests.
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

afterEach(() => {
  while (renderers.length) {
    const renderer = renderers.pop();
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  }
});


/** Count the placeholder cards: direct View children of the busy container. */
const countCards = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const container = renderer.root.find(
    node =>
      node.type === View && node.props.accessibilityState?.busy === true,
  );
  return container.props.children.filter(Boolean).length;
};

describe('SkeletonLoader', () => {
  const layouts: SkeletonLoaderProps['layout'][] = [
    'product-list',
    'log-list',
    'dashboard',
  ];

  it.each(layouts)('renders the "%s" layout without crashing', layout => {
    const renderer = renderSkeleton({layout});
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('renders the default number of cards when count is omitted', () => {
    const renderer = renderSkeleton({layout: 'product-list'});
    expect(countCards(renderer)).toBe(6);
  });

  it('renders exactly the requested number of cards', () => {
    const renderer = renderSkeleton({layout: 'log-list', count: 3});
    expect(countCards(renderer)).toBe(3);
  });

  it('falls back to the default count for non-positive counts', () => {
    const renderer = renderSkeleton({layout: 'dashboard', count: 0});
    expect(countCards(renderer)).toBe(6);
  });

  it('renders animated placeholder blocks driven by Animated', () => {
    const renderer = renderSkeleton({layout: 'product-list', count: 1});
    const animatedViews = renderer.root.findAllByType(Animated.View);
    expect(animatedViews.length).toBeGreaterThan(0);
  });

  it('exposes a busy accessibility state for assistive technology', () => {
    const renderer = renderSkeleton({layout: 'product-list'});
    const busy = renderer.root.findAll(
      node => node.props.accessibilityState?.busy === true,
    );
    expect(busy.length).toBeGreaterThan(0);
  });
});
