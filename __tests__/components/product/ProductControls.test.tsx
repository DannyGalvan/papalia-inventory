import React from 'react';
import { Image, Switch, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('../../../src/hooks/useTheme', () => {
  const { lightTheme: theme } = require('../../../src/design-system/themes');
  const value = { theme, isDark: false, toggleTheme: jest.fn() };
  return { __esModule: true, useTheme: () => value, default: () => value };
});
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

import { ProductActiveSwitch } from '../../../src/components/product/ProductActiveSwitch';
import { ProductImagePicker } from '../../../src/components/product/ProductImagePicker';
import { ProductStatusFilterBar } from '../../../src/components/product/ProductStatusFilterBar';

const create = (ui: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(ui);
  });
  return renderer;
};

const byLabel = (r: TestRenderer.ReactTestRenderer, label: string) =>
  r.root.find(
    n => n.type === TouchableOpacity && n.props.accessibilityLabel === label,
  );

describe('ProductImagePicker', () => {
  it('offers camera and gallery sources', () => {
    const onPick = jest.fn();
    const r = create(
      <ProductImagePicker
        image=""
        productName="Café"
        isProcessing={false}
        onPick={onPick}
      />,
    );
    act(() => byLabel(r, 'Tomar foto').props.onPress());
    act(() => byLabel(r, 'Galería').props.onPress());
    expect(onPick.mock.calls).toEqual([['camera'], ['library']]);
  });

  it('disables both actions while processing', () => {
    const r = create(
      <ProductImagePicker
        image="file:///a.jpg"
        productName="Café"
        isProcessing
        onPick={jest.fn()}
      />,
    );
    expect(byLabel(r, 'Tomar foto').props.disabled).toBe(true);
    expect(byLabel(r, 'Galería').props.disabled).toBe(true);
    expect(r.root.findByType(Image).props.source).toEqual({
      uri: 'file:///a.jpg',
    });
  });
});

describe('ProductStatusFilterBar', () => {
  it('marks the selected option and reports changes', () => {
    const onChange = jest.fn();
    const r = create(
      <ProductStatusFilterBar value="active" onChange={onChange} />,
    );
    const tabs = r.root.findAll(
      n => n.type === TouchableOpacity && n.props.accessibilityRole === 'tab',
    );
    expect(tabs.map(t => t.props.accessibilityState.selected)).toEqual([
      false,
      true,
      false,
    ]);
    act(() => tabs[2].props.onPress());
    expect(onChange).toHaveBeenCalledWith('inactive');
  });
});

describe('ProductActiveSwitch', () => {
  it('reflects and toggles the active state', () => {
    const onChange = jest.fn();
    const r = create(<ProductActiveSwitch value={false} onChange={onChange} />);
    const sw = r.root.findByType(Switch);
    expect(sw.props.value).toBe(false);
    act(() => sw.props.onValueChange(true));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
