import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { Toast } from '../../components/feedback/Toast';
import { LogForm } from '../../components/form/LogForm';
import { INPUT_DATA, INPUT_TYPES } from '../../config/constants';
import { LogHeader } from '../../database/models/LogHeader';
import {
  LogHeaderRepository,
  createLog,
} from '../../database/repository/LogHeaderRepository';
import { useTheme } from '../../hooks/useTheme';
import { CreateInputScreenProps } from '../../interfaces/IInputNavigation';
import { dateNowCreate } from '../../utils/dateTime';

const initialForm = LogHeaderRepository.create({
  comments: '',
  type: INPUT_TYPES.no_seleccionado,
  createdAt: dateNowCreate(),
  isInput: true,
  logDetails: [],
});

export const CreateInputScreen = ({}: CreateInputScreenProps) => {
  const { theme } = useTheme();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const sendForm = async (form: LogHeader) => {
    const result = await createLog(form);
    if (result.success) {
      showToast('Entrada creada exitosamente', 'success');
    } else {
      showToast(result.message || 'Error al crear la entrada', 'error');
    }
    return result;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight },
        ]}
        accessibilityRole="header">
        Crear entrada de producto
      </Text>
      <LogForm
        initialForm={initialForm}
        isReadonly={false}
        onSubmit={sendForm}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  title: {
    fontStyle: 'italic',
    paddingVertical: 10,
    textAlign: 'center',
  },
});
