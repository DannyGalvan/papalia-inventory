import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useCancelMovement } from '../../hooks/useCancelMovement';
import { useMovementDetail } from '../../hooks/useMovementDetail';
import { useTheme } from '../../hooks/useTheme';
import { isCancelRejection } from '../../services/movement/types';
import { Toast, ToastType } from '../feedback/Toast';
import { LogDetailView } from '../LogDetailView';
import { CancelledMovementBanner } from './CancelledMovementBanner';
import { CancelMovementButton } from './CancelMovementButton';
import { CancelMovementModal } from './CancelMovementModal';

interface Props {
  id: number;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

/**
 * Detail screen body shared by inputs and outputs: shows the movement and
 * lets the user cancel it (with reason) when it is still active.
 */
export const MovementDetail = ({ id }: Props) => {
  const { theme } = useTheme();
  const { movement, reload } = useMovementDetail(id);
  const { cancelMovement, isCancelling } = useCancelMovement();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const openDialog = useCallback(() => {
    setSubmitError(null);
    setDialogVisible(true);
  }, []);

  const closeDialog = useCallback(() => setDialogVisible(false), []);

  const handleConfirm = useCallback(
    async (reason: string) => {
      const result = await cancelMovement(id, reason);
      if (!isCancelRejection(result)) {
        setDialogVisible(false);
        setToast({ visible: true, message: result.message, type: 'success' });
        await reload();
        return;
      }
      if (result.failure === 'already_cancelled') {
        setDialogVisible(false);
        setToast({ visible: true, message: result.message, type: 'warning' });
        await reload();
        return;
      }
      // Keep the dialog open so the user can read why it was rejected.
      setSubmitError(result.message);
    },
    [cancelMovement, id, reload],
  );

  if (!movement) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isCancelled = movement.isCancelled === true;

  return (
    <View style={styles.flex}>
      <LogDetailView
        log={movement}
        banner={
          isCancelled ? (
            <CancelledMovementBanner
              cancelledAt={movement.cancelledAt}
              reason={movement.cancelReason}
            />
          ) : null
        }
        footer={
          isCancelled ? null : (
            <CancelMovementButton
              isInput={movement.isInput}
              disabled={isCancelling}
              onPress={openDialog}
            />
          )
        }
      />
      <CancelMovementModal
        visible={dialogVisible}
        isInput={movement.isInput}
        isSubmitting={isCancelling}
        submitError={submitError}
        onConfirm={handleConfirm}
        onClose={closeDialog}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
