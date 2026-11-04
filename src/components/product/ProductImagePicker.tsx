import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { ImageSourceKind } from '../../services/image/types';
import { resolveImageUri } from '../../utils/filePaths';

const NO_IMAGE = require('../../assets/sin_imagen.png');

interface Props {
  image: string;
  productName: string;
  isProcessing: boolean;
  onPick: (source: ImageSourceKind) => void;
}

interface SourceButtonProps {
  icon: string;
  label: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
}

const SourceButton = ({
  icon,
  label,
  hint,
  disabled,
  onPress,
}: SourceButtonProps) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.sourceButton,
        {
          borderColor: theme.colors.primary,
          borderRadius: theme.borderRadius.md,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
    >
      <Icon name={icon} size={20} color={theme.colors.primary} />
      <Text style={[styles.sourceText, { color: theme.colors.primary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/** Product photo preview with "take photo" and "choose from gallery" actions. */
export const ProductImagePicker = ({
  image,
  productName,
  isProcessing,
  onPick,
}: Props) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View>
        <Image
          style={[styles.image, { backgroundColor: theme.colors.border }]}
          source={image ? { uri: resolveImageUri(image) } : NO_IMAGE}
          accessibilityRole="image"
          accessibilityLabel={
            productName
              ? `Imagen del producto ${productName}`
              : 'Sin imagen seleccionada'
          }
        />
        {isProcessing && (
          <View style={styles.overlay} accessibilityLabel="Procesando imagen">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <SourceButton
          icon="camera-outline"
          label="Tomar foto"
          hint="Abre la cámara para fotografiar el producto"
          disabled={isProcessing}
          onPress={() => onPick('camera')}
        />
        <SourceButton
          icon="images-outline"
          label="Galería"
          hint="Abre la galería para elegir una imagen del producto"
          disabled={isProcessing}
          onPress={() => onPick('library')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  container: { alignItems: 'center', marginVertical: 16, gap: 12 },
  image: { width: 180, height: 180, resizeMode: 'contain', borderRadius: 8 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
  },
  actions: { flexDirection: 'row', gap: 12 },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  sourceText: { fontSize: 14, fontWeight: '600' },
});
