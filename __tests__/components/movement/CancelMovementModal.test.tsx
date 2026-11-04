import React from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('../../../src/hooks/useTheme', () => {
  const { lightTheme: theme } = require('../../../src/design-system/themes');
  const value = { theme, isDark: false, toggleTheme: jest.fn() };
  return { __esModule: true, useTheme: () => value, default: () => value };
});

import { CancelMovementModal } from '../../../src/components/movement/CancelMovementModal';

const render = (
  props: Partial<React.ComponentProps<typeof CancelMovementModal>>,
) => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <CancelMovementModal
        visible
        isInput
        isSubmitting={false}
        onConfirm={onConfirm}
        onClose={onClose}
        {...props}
      />,
    );
  });
  const confirmButton = () =>
    renderer.root.findAll(
      n =>
        n.type === TouchableOpacity &&
        String(n.props.accessibilityLabel).startsWith('Confirmar'),
    )[0];
  const texts = () =>
    renderer.root
      .findAllByType(Text)
      .map(t => t.props.children)
      .flat();
  return { renderer, onConfirm, onClose, confirmButton, texts };
};

describe('CancelMovementModal', () => {
  it('describes the effect for inputs and outputs', () => {
    expect(render({ isInput: true }).texts().join(' ')).toMatch(
      /Se restará del inventario/,
    );
    expect(render({ isInput: false }).texts().join(' ')).toMatch(
      /Se devolverá al inventario/,
    );
  });

  it('requires a valid reason before confirming', () => {
    const { renderer, onConfirm, confirmButton, texts } = render({});
    act(() => confirmButton().props.onPress());
    expect(onConfirm).not.toHaveBeenCalled();
    expect(texts().join(' ')).toMatch(/al menos 5 caracteres/);

    act(() =>
      renderer.root
        .findByType(TextInput)
        .props.onChangeText('Error de captura'),
    );
    act(() => confirmButton().props.onPress());
    expect(onConfirm).toHaveBeenCalledWith('Error de captura');
  });

  it('shows the error returned by the service', () => {
    const { texts } = render({ submitError: 'No se puede cancelar: Café' });
    expect(texts()).toContain('No se puede cancelar: Café');
  });

  it('does not confirm while submitting', () => {
    const { renderer, onConfirm, confirmButton } = render({
      isSubmitting: true,
    });
    act(() =>
      renderer.root.findByType(TextInput).props.onChangeText('Motivo válido'),
    );
    act(() => confirmButton().props.onPress());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
