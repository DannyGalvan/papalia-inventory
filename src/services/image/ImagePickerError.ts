/** Normalized failure reasons for image acquisition and storage. */
export type ImagePickerErrorCode =
  | 'camera_unavailable'
  | 'permission'
  | 'storage_permission'
  | 'missing_code'
  | 'unknown';

/** User-facing (Spanish) messages for each failure reason. */
export const IMAGE_ERROR_MESSAGES: Record<ImagePickerErrorCode, string> = {
  camera_unavailable: 'La cámara no está disponible en este dispositivo.',
  permission:
    'No se otorgó el permiso necesario. Habilítalo desde Configuración del dispositivo.',
  storage_permission:
    'No se otorgaron los permisos necesarios para guardar imágenes. Habilítalos desde Configuración del dispositivo.',
  missing_code: 'El producto debe contar con un código para subir imagen.',
  unknown:
    'No se pudo guardar la imagen. Verifica los permisos e intenta de nuevo.',
};

/** Domain error raised by the image feature with a stable `code`. */
export class ImagePickerError extends Error {
  readonly code: ImagePickerErrorCode;

  constructor(code: ImagePickerErrorCode, detail?: string) {
    super(detail || IMAGE_ERROR_MESSAGES[code]);
    this.name = 'ImagePickerError';
    this.code = code;
  }

  /** Spanish message safe to show to the user. */
  get userMessage(): string {
    return IMAGE_ERROR_MESSAGES[this.code];
  }
}
