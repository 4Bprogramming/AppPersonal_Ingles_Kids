import { SchemaType, type ResponseSchema } from '@google/generative-ai';

/** Actividad mínima requerida por unidad */
const activitySchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    id: { type: SchemaType.STRING },
    type: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['drag_drop_audio', 'visual_classification', 'cloze', 'teacher_mode'],
    },
    title: { type: SchemaType.STRING },
    targetText: { type: SchemaType.STRING },
    illustration: { type: SchemaType.STRING },
    vocabulary: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    personalizedContext: { type: SchemaType.STRING },
    draggableWords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    dropZones: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          correctWord: { type: SchemaType.STRING },
        },
        required: ['label', 'correctWord'],
      },
    },
    categories: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          label: { type: SchemaType.STRING },
          emoji: { type: SchemaType.STRING },
        },
        required: ['id', 'label', 'emoji'],
      },
    },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          label: { type: SchemaType.STRING },
          emoji: { type: SchemaType.STRING },
          categoryId: { type: SchemaType.STRING },
        },
        required: ['id', 'label', 'categoryId'],
      },
    },
    sentence: { type: SchemaType.STRING },
    blanks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          index: { type: SchemaType.INTEGER },
          answer: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['index', 'answer', 'options'],
      },
    },
    teacherAvatar: { type: SchemaType.STRING },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          prompt: { type: SchemaType.STRING },
          expectedAnswer: { type: SchemaType.STRING },
          hint: { type: SchemaType.STRING },
        },
        required: ['id', 'prompt', 'expectedAnswer'],
      },
    },
  },
  required: ['id', 'type', 'title', 'targetText', 'illustration', 'vocabulary'],
};

const unitSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    unitNumber: { type: SchemaType.INTEGER },
    title: { type: SchemaType.STRING },
    emoji: { type: SchemaType.STRING },
    vocabulary: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    grammarTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    personalizedThemes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    activities: { type: SchemaType.ARRAY, items: activitySchema },
  },
  required: ['unitNumber', 'title', 'emoji', 'vocabulary', 'grammarTopics', 'activities'],
};

/**
 * responseSchema para generateContent — fuerza JSON estricto sin texto adicional.
 * Usado con gemini-1.5-pro + responseMimeType: application/json
 */
export const curriculumResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    units: {
      type: SchemaType.ARRAY,
      items: unitSchema,
    },
  },
  required: ['units'],
};
