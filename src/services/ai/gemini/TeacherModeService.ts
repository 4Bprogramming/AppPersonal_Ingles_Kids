import { SchemaType } from '@google/generative-ai';
import type { ChildInterests } from '../../../types/index.js';
import { getGeminiClient, GEMINI_MODELS } from './client.js';
import {
  teacherModeResponseSchema,
  type TeacherModeAIResponse,
} from './schemas/teacherModeSchema.js';

export interface TeacherModeInput {
  childName: string;
  childAge: number;
  interests: ChildInterests;
  questionPrompt: string;
  expectedAnswer: string;
  studentAnswer: string;
  unitTitle?: string;
}

/**
 * Respuestas rápidas de texto para Teacher Mode — gemini-1.5-flash.
 */
export class TeacherModeService {
  async evaluateAnswer(input: TeacherModeInput): Promise<TeacherModeAIResponse> {
    const client = getGeminiClient();

    const sports = input.interests.favorite_sports?.join(', ') ?? '';
    const family = input.interests.family
      ? Object.values(input.interests.family).join(', ')
      : '';

    const systemInstruction = `Sos una maestra de inglés amable para niños de ${input.childAge} años.
Evaluá la respuesta del alumno "${input.childName}".
Intereses: fútbol (${sports}), familia (${family}).
REGLAS:
- feedbackColor SOLO puede ser: "correct" (acierto), "retry" (casi/error amable), "neutral".
- PROHIBIDO mencionar notas malas o usar tono negativo.
- Mensajes cortos, claros, en inglés simple mezclado con español si ayuda.
- Si falla, dá un hint sin revelar la respuesta completa.`;

    const userPrompt = `Unidad: ${input.unitTitle ?? 'English class'}
Pregunta de la maestra: "${input.questionPrompt}"
Respuesta esperada: "${input.expectedAnswer}"
Lo que dijo el niño: "${input.studentAnswer}"

Evaluá si la respuesta del niño es correcta (tolerancia fonética para 7 años).
Respondé con el JSON del schema.`;

    const model = client.getGenerativeModel({
      model: GEMINI_MODELS.flash,
      systemInstruction,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: teacherModeResponseSchema,
      },
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    if (!text) {
      throw new Error('Teacher Mode: respuesta vacía de Gemini Flash');
    }

    return JSON.parse(text) as TeacherModeAIResponse;
  }

  /** Genera una pregunta de seguimiento de la maestra (sin evaluar alumno) */
  async generateTeacherPrompt(
    topic: string,
    childName: string,
    childAge: number,
  ): Promise<{ prompt: string; expectedAnswer: string }> {
    const client = getGeminiClient();

    const model = client.getGenerativeModel({
      model: GEMINI_MODELS.flash,
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            prompt: { type: SchemaType.STRING },
            expectedAnswer: { type: SchemaType.STRING },
          },
          required: ['prompt', 'expectedAnswer'],
        },
      },
    });

    const result = await model.generateContent(
      `Generá UNA pregunta oral simple en inglés sobre "${topic}" para ${childName} (${childAge} años).`,
    );

    return JSON.parse(result.response.text()) as { prompt: string; expectedAnswer: string };
  }
}

export const teacherModeService = new TeacherModeService();
