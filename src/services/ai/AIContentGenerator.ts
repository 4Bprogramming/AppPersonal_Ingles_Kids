import type { Activity, GenerateCurriculumInput, Unit } from '../../types/index.js';
import {
  geminiVisionService,
  type CurriculumAIResponse,
} from './gemini/GeminiVisionService.js';
import { isGeminiConfigured } from './gemini/client.js';
import { prepareImageFromBase64 } from './imageUtils.js';
import { formatGeminiError } from './gemini/formatGeminiError.js';

const REQUIRED_TYPES = [
  'drag_drop_audio',
  'visual_classification',
  'cloze',
  'teacher_mode',
] as const;

export interface GenerateCurriculumResult {
  success: boolean;
  units: Unit[];
  error?: string;
}

/**
 * Controlador central de IA — SDK oficial @google/generative-ai en Railway.
 * - gemini-2.5-flash: OCR multimodal del índice + Teacher Mode
 */
export class AIContentGenerator {
  isConfigured(): boolean {
    return isGeminiConfigured();
  }

  async generateCurriculumFromIndex(
    input: GenerateCurriculumInput,
  ): Promise<GenerateCurriculumResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        units: [],
        error: 'GEMINI_API_KEY no configurada en Railway',
      };
    }

    try {
      const image = input.imageBuffer
        ? {
            base64: input.imageBuffer.toString('base64'),
            buffer: input.imageBuffer,
            mimeType: input.mimeType,
          }
        : prepareImageFromBase64(input.imageBase64, input.mimeType);

      const parsed = await geminiVisionService.generateCurriculumFromImage(
        input.childName,
        input.childAge,
        input.bookTitle,
        input.interests,
        image,
      );

      const units = this.normalizeUnits(parsed);

      if (units.length !== 9) {
        return {
          success: false,
          units: [],
          error: `Se esperaban 9 unidades, se obtuvieron ${units.length}`,
        };
      }

      return { success: true, units };
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Error desconocido en Gemini';
      return {
        success: false,
        units: [],
        error: formatGeminiError(raw),
      };
    }
  }

  private normalizeUnits(parsed: CurriculumAIResponse): Unit[] {
    return (parsed.units ?? [])
      .sort((a, b) => a.unitNumber - b.unitNumber)
      .map((raw) => ({
        id: `unit-${raw.unitNumber}`,
        unitNumber: raw.unitNumber,
        title: raw.title,
        emoji: raw.emoji ?? '📚',
        vocabulary: raw.vocabulary ?? [],
        grammarTopics: raw.grammarTopics ?? [],
        personalizedThemes: raw.personalizedThemes ?? [],
        activities: this.ensureActivities(raw.activities ?? [], raw.unitNumber),
        generatedAt: new Date().toISOString(),
        sourceBook: 'small_big_things_1' as const,
      }));
  }

  private ensureActivities(activities: Activity[], unitNumber: number): Activity[] {
    const byType = new Map(activities.map((a) => [a.type, a]));
    return REQUIRED_TYPES.map((type, i) => {
      const existing = byType.get(type);
      if (existing) return existing;
      return {
        id: `u${unitNumber}-act-${i + 1}`,
        type,
        title: `Unit ${unitNumber} — ${type}`,
        targetText: 'Practice makes perfect!',
        illustration: '📚',
        vocabulary: ['practice'],
      } as Activity;
    });
  }
}

export const aiContentGenerator = new AIContentGenerator();
