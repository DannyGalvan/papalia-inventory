import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('../../../src/hooks/useTheme', () => {
  const { lightTheme: theme } = require('../../../src/design-system/themes');
  const value = { theme, isDark: false, toggleTheme: jest.fn() };
  return { __esModule: true, useTheme: () => value, default: () => value };
});

jest.mock('../../../src/context/TimezoneContext', () => ({
  useTimezone: () => ({
    ianaTimezone: 'America/Guatemala',
    formatDateTime: (d: Date) => `fmt:${d.toISOString()}`,
  }),
}));

jest.mock('react-native-date-picker', () => {
  const { View } = require('react-native');
  const MockDatePicker = (props: object) => (
    <View testID="date-picker" {...props} />
  );
  return { __esModule: true, default: MockDatePicker };
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

import { MovementDateField } from '../../../src/components/input/MovementDateField';

const NOW = new Date('2026-11-05T15:00:00.000Z');

const render = (
  props: Partial<React.ComponentProps<typeof MovementDateField>> = {},
) => {
  const onChange = jest.fn();
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <MovementDateField
        isInput={false}
        onChange={onChange}
        now={() => new Date(NOW)}
        {...props}
      />,
    );
  });
  const texts = () =>
    renderer.root.findAllByType(Text).map(t => String(t.props.children));
  const button = () => renderer.root.findByType(TouchableOpacity);
  const picker = () => renderer.root.findAllByProps({ testID: 'date-picker' });
  return { renderer, onChange, texts, button, picker };
};

describe('MovementDateField', () => {
  it('labels outputs as sale date and inputs as receipt date', () => {
    expect(render({ isInput: false }).texts()).toContain('Fecha de venta');
    expect(render({ isInput: true }).texts()).toContain('Fecha de entrada');
  });

  it('shows "now" when no date was chosen and the chosen date otherwise', () => {
    expect(render().texts()).toContain(`fmt:${NOW.toISOString()}`);
    const chosen = new Date('2026-11-01T12:00:00.000Z');
    expect(render({ value: chosen }).texts()).toContain(
      `fmt:${chosen.toISOString()}`,
    );
  });

  it('opens a datetime picker that blocks future dates', () => {
    const { button, picker } = render();
    expect(picker()).toHaveLength(0);
    act(() => button().props.onPress());
    const [p] = picker();
    expect(p.props.mode).toBe('datetime');
    expect(p.props.maximumDate).toEqual(NOW);
    // America/Guatemala is UTC-6.
    expect(p.props.timeZoneOffsetInMinutes).toBe(-360);
  });

  it('reports the confirmed date and closes the picker', () => {
    const { button, picker, onChange } = render();
    act(() => button().props.onPress());
    const chosen = new Date('2026-11-02T09:30:00.000Z');
    act(() => picker()[0].props.onConfirm(chosen));
    expect(onChange).toHaveBeenCalledWith(chosen);
    expect(picker()).toHaveLength(0);
  });

  it('does not change the date when the picker is cancelled', () => {
    const { button, picker, onChange } = render();
    act(() => button().props.onPress());
    act(() => picker()[0].props.onCancel());
    expect(onChange).not.toHaveBeenCalled();
    expect(picker()).toHaveLength(0);
  });

  it('is disabled when readonly', () => {
    expect(render({ readonly: true }).button().props.disabled).toBe(true);
  });

  it('shows the validation error', () => {
    const { texts } = render({ error: 'La fecha no puede ser posterior' });
    expect(texts()).toContain('La fecha no puede ser posterior');
  });
});
