import { SchemaType, type ResponseSchema } from '@google/generative-ai';

/**
 * Respuesta estructurada del Teacher Mode (gemini-1.5-flash).
 * Sin rojo: feedback amigable en verde/amarillo/neutral.
 */
export const teacherModeResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    teacherMessage: {
      type: SchemaType.STRING,
      description: 'Mensaje corto de la maestra al niño, tono alentador',
    },
    isCorrect: { type: SchemaType.BOOLEAN },
    feedbackColor: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['correct', 'retry', 'neutral'],
      description: 'correct=verde, retry=amarillo. NUNCA usar rojo.',
    },
    hint: {
      type: SchemaType.STRING,
      description: 'Pista opcional si el niño falló',
    },
    encouragement: {
      type: SchemaType.STRING,
      description: 'Frase motivadora breve',
    },
  },
  required: ['teacherMessage', 'isCorrect', 'feedbackColor', 'encouragement'],
};

export interface TeacherModeAIResponse {
  teacherMessage: string;
  isCorrect: boolean;
  feedbackColor: 'correct' | 'retry' | 'neutral';
  hint?: string;
  encouragement: string;
}
