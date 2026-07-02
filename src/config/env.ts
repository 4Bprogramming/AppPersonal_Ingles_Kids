import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  AI_PROVIDER: (process.env.AI_PROVIDER ?? 'gemini') as 'gemini' | 'openai',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  GEMINI_FLASH_MODEL: process.env.GEMINI_FLASH_MODEL ?? 'gemini-2.5-flash',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
  ADMIN_PIN: process.env.ADMIN_PIN ?? '1234',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
};
