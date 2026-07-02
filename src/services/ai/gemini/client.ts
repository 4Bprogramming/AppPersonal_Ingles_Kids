import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../../config/env.js';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAI;
}

export function isGeminiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

export const GEMINI_MODELS = {
  vision: env.GEMINI_MODEL || 'gemini-1.5-pro',
  flash: env.GEMINI_FLASH_MODEL || 'gemini-1.5-flash',
} as const;
