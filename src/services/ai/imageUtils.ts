/**
 * Utilidades para imágenes enviadas desde React Native (Expo ImagePicker / FormData).
 * Convierte Buffer de Multer o Base64 (con o sin prefijo data-URI) al formato del SDK.
 */

export interface PreparedImage {
  /** Base64 limpio sin prefijo data-URI */
  base64: string;
  /** Buffer binario listo para inlineData del SDK */
  buffer: Buffer;
  mimeType: string;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

/** Normaliza Base64 recibido desde RN (puede incluir data:image/jpeg;base64,) */
export function normalizeBase64(input: string): string {
  const match = input.match(/^data:([^;]+);base64,(.+)$/);
  if (match) return match[2];
  return input.replace(/\s/g, '');
}

export function bufferFromBase64(base64: string): Buffer {
  return Buffer.from(normalizeBase64(base64), 'base64');
}

export function prepareImageFromBase64(
  imageBase64: string,
  mimeType = 'image/jpeg',
): PreparedImage {
  const base64 = normalizeBase64(imageBase64);
  return {
    base64,
    buffer: Buffer.from(base64, 'base64'),
    mimeType,
  };
}

/** Multer memoryStorage — file.buffer ya es Buffer de la foto de RN */
export function prepareImageFromMulter(file: {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
}): PreparedImage {
  const mimeType =
    file.mimetype ||
    MIME_BY_EXT[file.originalname?.split('.').pop()?.toLowerCase() ?? ''] ||
    'image/jpeg';

  return {
    base64: file.buffer.toString('base64'),
    buffer: file.buffer,
    mimeType,
  };
}

export function toGeminiInlineData(image: PreparedImage) {
  return {
    inlineData: {
      data: image.base64,
      mimeType: image.mimeType,
    },
  };
}
