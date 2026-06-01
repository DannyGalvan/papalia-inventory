import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { Toast } from '../../components/feedback/Toast';
import { LogForm } from '../../components/form/LogForm';
import { OUPUT_DATA, OUTPUT_TYPES } from '../../config/constants';
import { LogHeader } from '../../database/models/LogHeader';
import {
    LogHeaderRepository,
    createLog,
} from '../../database/repository/LogHeaderRepository';
import { getProductById } from '../../database/repository/ProductRepository';
import { useTheme } from '../../hooks/useTheme';
import { dateNowCreate } from '../../utils/dateTime';
import { validateStockForOutput } from '../../utils/stockValidator';

const initialForm = LogHeaderRepository.create({
  comments: '',
  type: OUTPUT_TYPES.no_seleccionado,
  createdAt: dateNowCreate(),
  isInput: false,
  logDetails: [],
});

export const CreateOutputScreen = () => {
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
    try {
      const stockMap = new Map<string, number>();
      await Promise.all(
        form.logDetails.map(async detail => {
          const product = await getProductById(detail.productCode);
          stockMap.set(detail.productCode, product?.stock ?? 0);
        }),
      );
      const validation = validateStockForOutput(
        form.logDetails.map(d => ({
          productCode: d.productCode,
          name: d.name,
          quantity: d.quantity,
        })),
        stockMap,
      );
      if (!validation.isValid) {
        showToast(validation.errorMessage!, 'error');
        return {success: false, message: validation.errorMessage};
      }
    } catch {
      showToast('Error al verificar el stock disponible', 'error');
      return {success: false, message: 'Error al verificar el stock disponible'};
    }

    const result = await createLog(form);
    if (result.success) {
      showToast('Salida creada exitosamente', 'success');
    } else {
      showToast(result.message || 'Error al crear la salida', 'error');
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
        Crear salida de producto
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
