import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import {
  CANCEL_REASON_MAX_LENGTH,
  validateCancelReason,
} from '../../services/movement/cancelReason';

interface Props {
  visible: boolean;
  isInput: boolean;
  isSubmitting: boolean;
  /** Error returned by the last attempt (e.g. negative stock). */
  submitError?: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** Confirmation dialog that captures the mandatory cancellation reason. */
export const CancelMovementModal = ({
  visible,
  isInput,
  isSubmitting,
  submitError,
  onConfirm,
  onClose,
}: Props) => {
  const { theme } = useTheme();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (visible) {
      setReason('');
      setTouched(false);
    }
  }, [visible]);

  const validationError = validateCancelReason(reason);
  const shownError = (touched && validationError) || submitError || null;
  const kind = isInput ? 'entrada' : 'salida';
  const effect = isInput
    ? 'Se restará del inventario el stock que ingresó esta entrada.'
    : 'Se devolverá al inventario el stock que salió con esta salida.';

  const handleConfirm = () => {
    setTouched(true);
    if (!validationError && !isSubmitting) {
      onConfirm(reason);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isSubmitting ? undefined : onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          accessibilityViewIsModal
        >
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            accessibilityRole="header"
          >
            Cancelar {kind}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
            {effect} La operación quedará en el historial marcada como cancelada
            y no contará en reportes. Esta acción no se puede deshacer.
          </Text>

          <Text style={[styles.label, { color: theme.colors.text }]}>
            Motivo de la cancelación
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: shownError
                  ? theme.colors.error
                  : theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
              },
            ]}
            value={reason}
            onChangeText={setReason}
            onBlur={() => setTouched(true)}
            placeholder="Ej. Cantidad registrada por error"
            placeholderTextColor={theme.colors.disabled}
            maxLength={CANCEL_REASON_MAX_LENGTH}
            multiline
            editable={!isSubmitting}
            accessibilityLabel="Motivo de la cancelación"
          />
          <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
            {reason.length}/{CANCEL_REASON_MAX_LENGTH}
          </Text>
          {!!shownError && (
            <Text
              style={[styles.error, { color: theme.colors.error }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              {shownError}
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { borderColor: theme.colors.border }]}
              onPress={onClose}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Volver sin cancelar"
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Volver
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirm,
                {
                  backgroundColor: theme.colors.error,
                  borderColor: theme.colors.error,
                },
              ]}
              onPress={handleConfirm}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={`Confirmar cancelación de la ${kind}`}
              accessibilityState={{
                disabled: isSubmitting,
                busy: isSubmitting,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, styles.confirmText]}>
                  Cancelar {kind}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: { padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 80,
    padding: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  error: { fontSize: 13, marginTop: 6 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirm: { minWidth: 140 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  confirmText: { color: '#FFFFFF' },
});
