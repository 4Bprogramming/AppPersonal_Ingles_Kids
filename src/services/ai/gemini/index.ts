export { getGeminiClient, isGeminiConfigured, GEMINI_MODELS } from './client.js';
export {
  GeminiVisionService,
  geminiVisionService,
  type CurriculumAIResponse,
} from './GeminiVisionService.js';
export { TeacherModeService, teacherModeService } from './TeacherModeService.js';
export { curriculumResponseSchema } from './schemas/curriculumSchema.js';
export { teacherModeResponseSchema } from './schemas/teacherModeSchema.js';
export type { TeacherModeAIResponse } from './schemas/teacherModeSchema.js';
