import type { ChildInterests } from '../../../types/index.js';
import { buildSystemPrompt, buildUserPrompt } from '../prompts/systemPrompt.js';
import { getGeminiClient, GEMINI_MODELS } from './client.js';
import { curriculumResponseSchema } from './schemas/curriculumSchema.js';
import {
  type PreparedImage,
  prepareImageFromBase64,
  prepareImageFromMulter,
  toGeminiInlineData,
} from '../imageUtils.js';
import type { Activity } from '../../../types/index.js';

export interface CurriculumAIResponse {
  units: Array<{
    unitNumber: number;
    title: string;
    emoji?: string;
    vocabulary?: string[];
    grammarTopics?: string[];
    personalizedThemes?: string[];
    activities?: Activity[];
  }>;
}

export interface VisionGenerateInput {
  systemPrompt: string;
  userPrompt: string;
  image: PreparedImage;
}

/**
 * Análisis multimodal con gemini-1.5-pro + responseSchema (JSON estricto).
 */
export class GeminiVisionService {
  async generateCurriculumFromImage(
    childName: string,
    childAge: number,
    bookTitle: string,
    interests: ChildInterests,
    image: PreparedImage,
  ): Promise<CurriculumAIResponse> {
    const systemPrompt = buildSystemPrompt(childName, childAge, bookTitle, interests);
    const userPrompt = buildUserPrompt();
    return this.generateStructured(systemPrompt, userPrompt, image);
  }

  async generateStructured(
    systemPrompt: string,
    userPrompt: string,
    image: PreparedImage,
  ): Promise<CurriculumAIResponse> {
    const client = getGeminiClient();

    const model = client.getGenerativeModel({
      model: GEMINI_MODELS.vision,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
        responseSchema: curriculumResponseSchema,
      },
    });

    const result = await model.generateContent([
      userPrompt,
      toGeminiInlineData(image),
    ]);

    const text = result.response.text();
    if (!text) {
      throw new Error('Gemini no devolvió contenido estructurado');
    }

    return JSON.parse(text) as CurriculumAIResponse;
  }

  /** Acepta Buffer de Multer (upload RN) */
  static imageFromMulter(file: { buffer: Buffer; mimetype: string; originalname?: string }): PreparedImage {
    return prepareImageFromMulter(file);
  }

  /** Acepta Base64 desde body JSON (alternativa a multipart) */
  static imageFromBase64(base64: string, mimeType: string): PreparedImage {
    return prepareImageFromBase64(base64, mimeType);
  }
}

export const geminiVisionService = new GeminiVisionService();
