/** Mensajes claros para errores de la API de Gemini (sin JSON crudo en la app). */
export function formatGeminiError(raw: string): string {
  const lower = raw.toLowerCase();

  if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('quotafailure') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return (
      'Cuota de Gemini agotada (plan gratuito). ' +
      'Esperá 1–2 minutos e intentá de nuevo. ' +
      'Si sigue fallando, activá facturación en Google AI Studio (aistudio.google.com/apikey).'
    );
  }

  if (lower.includes('404 not found') && lower.includes('models/')) {
    return 'Modelo de IA no disponible. El administrador debe actualizar GEMINI_MODEL en Railway.';
  }

  if (lower.includes('api key') || lower.includes('api_key_invalid')) {
    return 'Clave de Gemini inválida. Revisá GEMINI_API_KEY en Railway (debe empezar con AIza...).';
  }

  if (raw.length > 180) {
    return 'No se pudo analizar la imagen con IA. Intentá con otra foto o más tarde.';
  }

  return raw;
}
