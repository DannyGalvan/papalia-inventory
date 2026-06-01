/**
 * Unit tests for the EmptyState feedback component.
 *
 * Verifies that the component renders the Spanish title and description, the
 * provided icon, and exposes accessibility metadata. The `useTheme` hook is
 * mocked to supply the real `lightTheme` tokens so the component consumes
 * genuine theme values without pulling in the database-backed ThemeProvider.
 *
 * Requirements: 8.7, 4.1
 */

import React from 'react';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ReactTestRenderer from 'react-test-renderer';
import { EmptyState } from '../../src/components/feedback/EmptyState';
import { lightTheme } from '../../src/design-system/themes';

// The native vector-icons module ships untranspiled ESM; mock it with a simple
// component that forwards its props so we can assert on the icon name.
jest.mock('react-native-vector-icons/Ionicons', () => {
  const {Text: RNText} = require('react-native');
  return (props: {name: string}) => <RNText {...props} />;
});

// useTheme transitively imports the TypeORM/native SQLite layer (via
// ThemeContext). Mock the hook to return the real lightTheme tokens so the
// component is exercised with genuine theme values, decoupled from the DB.
jest.mock('../../src/hooks/useTheme', () => {
  const {lightTheme: theme} = require('../../src/design-system/themes');
  return {
    useTheme: () => ({theme, isDark: false, toggleTheme: () => {}}),
    __esModule: true,
    default: () => ({theme, isDark: false, toggleTheme: () => {}}),
  };
});

const renderEmptyState = (props: {
  title: string;
  description: string;
  icon: string;
}) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<EmptyState {...props} />);
  });
  return renderer;
};

describe('EmptyState', () => {
  const props = {
    title: 'Sin productos',
    description: 'Aún no hay productos. Toca el botón + para agregar uno.',
    icon: 'cube-outline',
  };

  it('renders the Spanish title and description text', () => {
    const renderer = renderEmptyState(props);
    const texts = renderer.root
      .findAllByType(Text)
      .map(node => node.props.children);

    expect(texts).toContain(props.title);
    expect(texts).toContain(props.description);
  });

  it('renders the provided icon', () => {
    const renderer = renderEmptyState(props);
    const icon = renderer.root.findByType(Icon);

    expect(icon.props.name).toBe(props.icon);
  });

  it('applies theme typography tokens to the title', () => {
    const renderer = renderEmptyState(props);
    const titleNode = renderer.root.findByProps({
      accessibilityRole: 'header',
    });
    const flat = Object.assign({}, ...[].concat(titleNode.props.style));

    expect(flat.fontSize).toBe(lightTheme.typography.h2.fontSize);
    expect(flat.color).toBe(lightTheme.colors.text);
  });

  it('exposes an accessibility label combining title and description', () => {
    const renderer = renderEmptyState(props);
    const labelled = renderer.root.findAll(
      node =>
        node.props.accessibilityLabel ===
        `${props.title}. ${props.description}`,
    );

    expect(labelled.length).toBeGreaterThan(0);
  });

  it('marks the title with a header accessibility role', () => {
    const renderer = renderEmptyState(props);
    const headers = renderer.root.findAll(
      node => node.props.accessibilityRole === 'header',
    );

    expect(headers.length).toBeGreaterThan(0);
  });
});
